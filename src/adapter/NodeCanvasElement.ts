import { ICanvasRenderingContext2D, utils } from '@pixi/core';
import { AvifConfig, Canvas, ContextAttributes, SKRSContext2D } from '@napi-rs/canvas';

import type { ContextIds, ICanvas } from '@pixi/core';

/** Obtain the parameters of a function type in a tuple, except the first one */
type ParametersExceptFirst<T extends (...args: any) => any> = T extends (arg0: any, ...args: infer P) => any ? P : never;

type CanvasRenderingContext2D = SKRSContext2D;

/**
 * A node implementation of a canvas element.
 * Uses node-canvas and gl packages to provide the same
 * functionality as a normal HTMLCanvasElement.
 * @class
 */
export class NodeCanvasElement implements ICanvas
{
    /** Style of the canvas. */
    public style: Record<string, any>;

    private _canvas: Canvas;
    private _event: utils.EventEmitter;
    private _contextType?: ContextIds;
    private _ctx?: CanvasRenderingContext2D;

    constructor(width = 1, height = 1)
    {
        this._canvas = new Canvas(width, height);
        this._event = new utils.EventEmitter();
        this.style = {};
    }

    get width()
    {
        return this._canvas.width;
    }

    set width(value)
    {
        this._canvas.width = value;
    }

    get height()
    {
        return this._canvas.height;
    }

    set height(value)
    {
        this._canvas.height = value;
    }

    get clientWidth()
    {
        return this._canvas.width;
    }

    get clientHeight()
    {
        return this._canvas.height;
    }

    // @ts-expect-error 这里暂时无法兼容
    getContext(
        type: string,
        options?: ContextAttributes,
    ): ICanvasRenderingContext2D | null
    {
        switch (type)
        {
            case '2d':
            {
                if (this._contextType && this._contextType !== '2d') return null;
                if (this._ctx) return this._ctx as unknown as ICanvasRenderingContext2D;

                const ctx = this._canvas.getContext('2d', options as ContextAttributes);

                this._patch2DContext(ctx);

                this._ctx = ctx;
                this._contextType = '2d';

                return ctx as unknown as ICanvasRenderingContext2D;
            }
            default: return null;
        }
    }

    /**
     * For image canvases, encodes the canvas as a PNG. For PDF canvases,
     * encodes the canvas as a PDF. For SVG canvases, encodes the canvas as an
     * SVG.
     */
    toBuffer(): Buffer;
    toBuffer(mime: 'image/png'): Buffer;
    toBuffer(mime: 'image/jpeg' | 'image/webp', quality?: number): Buffer;
    toBuffer(mime: 'image/avif', cfg?: AvifConfig): Buffer;
    /**
     * Returns the unencoded pixel data, top-to-bottom. On little-endian (most)
     * systems, the array will be ordered BGRA; on big-endian systems, it will
     * be ARGB.
     */
    toBuffer(mimeType: 'raw'): Buffer;
    /**
     * Returns a buffer of the canvas contents.
     * @param args - the arguments to pass to the toBuffer method
     */
    toBuffer(...args: any): Buffer | void
    {
        return this._canvas.toBuffer(...args as Parameters<typeof Canvas.prototype.toBuffer>);
    }

    /** Defaults to PNG image. */
    toDataURL(): string;
    toDataURL(mime?: 'image/png'): string;
    toDataURL(mime: 'image/jpeg' | 'image/webp', quality?: number): string;
    toDataURL(mime?: 'image/jpeg' | 'image/webp' | 'image/png', quality?: number): string;
    toDataURL(mime?: 'image/avif', cfg?: AvifConfig): string;
    /**
     * Returns a base64 encoded string representation of the canvas.
     * @param args - The arguments to pass to the toDataURL method.
     */
    toDataURL(...args: any): string | void
    {
        return this._canvas.toDataURL(...args as Parameters<typeof Canvas.prototype.toDataURL>);
    }

    /**
     * Adds the listener for the specified event.
     * @param type - The type of event to listen for.
     * @param listener - The callback to invoke when the event is fired.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject)
    {
        return this._event.addListener(type, listener as any);
    }

    /**
     * Removes the listener for the specified event.
     * @param type - The type of event to listen for.
     * @param listener - The callback to invoke when the event is fired.
     */
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject)
    {
        if (listener)
        {
            return this._event.removeListener(type, listener as any);
        }

        return this._event.removeAllListeners(type);
    }

    /**
     * Dispatches the specified event.
     * @param event - The event to emit.
     * @param event.type - The type of event.
     */
    dispatchEvent(event: {type: string, [key: string]: any})
    {
        event.target = this;

        return this._event.emit(event.type, event);
    }

    /** Read canvas pixels as Uint8Array. */
    private _getPixels(): Uint8Array
    {
        switch (this._contextType)
        {
            case '2d':
            {
                const { width, height, _ctx: ctx } = this;

                const imageData = ctx?.getImageData(0, 0, width, height);

                if (imageData)
                {
                    const { buffer, byteOffset, length } = imageData.data;

                    return new Uint8Array(buffer, byteOffset, length);
                }

                return new Uint8Array(0);
            }
            default:
            {
                throw new Error('getContext() has not been called');
            }
        }
    }

    /**
     * Patch the 2D context.
     * @param ctx - The 2D context.
     */
    private _patch2DContext(ctx: CanvasRenderingContext2D)
    {
        const _drawImage = ctx.drawImage;

        ctx.drawImage = function drawImage(image: any, ...args: any)
        {
            if (image instanceof NodeCanvasElement)
            {
                image = image._canvas;
            }

            return _drawImage.call(this, image, ...args as ParametersExceptFirst<typeof _drawImage>);
        };

        const _createPattern = ctx.createPattern;

        ctx.createPattern = function createPattern(image: any, ...args: any)
        {
            if (image instanceof NodeCanvasElement)
            {
                image = image._canvas;
            }

            return _createPattern.call(this, image, ...args as ParametersExceptFirst<typeof _createPattern>);
        };
    }
}
