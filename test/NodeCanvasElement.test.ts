import { NodeCanvasElement } from '../src';

describe('NodeCanvasElement', () =>
{
    it('should create new canvas', () =>
    {
        const canvas = new NodeCanvasElement(100, 200);

        expect(canvas).toBeInstanceOf(NodeCanvasElement);

        expect(canvas.width).toStrictEqual(100);
        expect(canvas.height).toStrictEqual(200);
        expect(canvas.clientWidth).toStrictEqual(100);
        expect(canvas.clientHeight).toStrictEqual(200);

        expect(canvas.style).toStrictEqual({});
    });

    it('should resize', () =>
    {
        const canvas = new NodeCanvasElement(100, 200);

        canvas.width = 300;

        expect(canvas.width).toStrictEqual(300);
        expect(canvas.height).toStrictEqual(200);
        expect(canvas.clientWidth).toStrictEqual(300);
        expect(canvas.clientHeight).toStrictEqual(200);

        canvas.height = 400;

        expect(canvas.width).toStrictEqual(300);
        expect(canvas.height).toStrictEqual(400);
        expect(canvas.clientWidth).toStrictEqual(300);
        expect(canvas.clientHeight).toStrictEqual(400);
    });

    describe('getContext', () =>
    {
        it('should get 2D context', () =>
        {
            const canvas = new NodeCanvasElement(1, 1);

            const ctx = canvas.getContext('2d');

            expect(canvas.getContext('2d')).toBe(ctx);
        });

        it('should return null with unsupported context ID', () =>
        {
            const canvas = new NodeCanvasElement(1, 1);

            expect(canvas.getContext('bitmaprenderer')).toBeNull();
        });
    });
});
