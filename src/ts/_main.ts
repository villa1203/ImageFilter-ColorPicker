export async function main({thresholdLimitForTransition}: {
    thresholdLimitForTransition: number
}) {
    let _threshold = thresholdLimitForTransition
    let _pixelNumberOfMouseOver: IPixelNumber = {
        x: -1,
        y: -1,
    }

    const imageForEffect            = document.querySelector('.image-effect--image')
    const backgroundForEffect       = document.querySelector('.image-effect--background')
    const canvasRendererContainer   = document.querySelector('.image-effect--canvas-container')

    if (!(imageForEffect                instanceof HTMLImageElement))   return
    if (!(backgroundForEffect           instanceof HTMLImageElement))   return
    if (!(canvasRendererContainer       instanceof HTMLDivElement))     return

    // init variables
    const canvasForImage            = await createCanvasByImage(imageForEffect)
    const canvasForImage_ctx        = canvasForImage.getContext('2d')!
    const canvasForImage_imageData  = canvasForImage_ctx.getImageData(0, 0, canvasForImage.width, canvasForImage.height)

    const canvasForBackground           = await createCanvasByImage(backgroundForEffect)
    const canvasForBackground_ctx       = canvasForBackground.getContext('2d')!
    const canvasForBackground_imageData = canvasForBackground_ctx.getImageData(0, 0, canvasForBackground.width, canvasForBackground.height)

    const canvasForEffectRender             = await createCanvasByImage(imageForEffect)
    const canvasForEffectRender_ctx         = canvasForEffectRender.getContext('2d')!
    const canvasForEffectRender_imageData   = canvasForEffectRender_ctx.getImageData(0, 0, canvasForImage.width, canvasForImage.height)


    // init canvas
    canvasRendererContainer.appendChild(canvasForEffectRender)


    // set listener for effect update

    canvasForEffectRender.addEventListener('mousemove', (e: MouseEvent) => {
        _pixelNumberOfMouseOver  = getPixelNumberByPosition({
            poseX: e.x,
            poseY: e.y,
            imageReference: imageForEffect,
            canvasRenderer: canvasForEffectRender,
        })

        updateEffect({
            canvasForBackground_imageData,
            canvasForEffectRender_imageData,
            canvasForEffectRender_ctx,
            canvasForImage,
            canvasForImage_imageData,
            pixelNumberOfMouseOver: _pixelNumberOfMouseOver,
            threshold: _threshold,
        })
    })

    window.addEventListener('click', () => {
        let direction = 1

        function incrementThresholdRenderTransition(){
            _threshold += 5 * direction

            updateEffect({
                canvasForBackground_imageData,
                canvasForEffectRender_imageData,
                canvasForEffectRender_ctx,
                canvasForImage,
                canvasForImage_imageData,
                pixelNumberOfMouseOver: _pixelNumberOfMouseOver,
                threshold: _threshold,
            })

            window.requestAnimationFrame(() => {
                if(_threshold === thresholdLimitForTransition) {
                    direction = 1
                    return
                }

                if(_threshold > 255 && direction === 1)  direction = -1

                incrementThresholdRenderTransition()
            })
        }
        incrementThresholdRenderTransition()
    })
}

// =====
function valueIsBetweenTwo({value, min, max}: { value: number, min: number, max: number }) {
    return value < max && value > min
}

// ======
async function createCanvasByImage(image: HTMLImageElement, width?:number, height?: number): Promise<HTMLCanvasElement> {
    image.crossOrigin = 'Anonymous'
    const canvas = document.createElement("canvas")

    return new Promise(resolve => {

        if(image.complete) {
            initCanvas()
            resolve(canvas)
        } else {
            image.addEventListener('load', () => {
                initCanvas()
                resolve(canvas)
            })
        }
    })

    function initCanvas() {
        canvas.height = height || image.naturalHeight
        canvas.width = width || image.naturalWidth
        const canvasContext = canvas.getContext("2d")
        canvasContext?.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
}

// =====
interface IPixelNumber {
    x: number
    y: number
}
interface IPixelNumberByPositionParams {
    poseX: number
    poseY: number
    imageReference: HTMLImageElement
    canvasRenderer: HTMLCanvasElement,
}
function getPixelNumberByPosition({poseX, poseY, imageReference, canvasRenderer}: IPixelNumberByPositionParams): IPixelNumber {
    const ratioX = imageReference.naturalWidth / canvasRenderer.offsetWidth
    const ratioY = imageReference.naturalHeight / canvasRenderer.offsetHeight

    const domX = poseX + window.scrollX - canvasRenderer.offsetLeft
    const domY = poseY + window.scrollY - canvasRenderer.offsetTop

    return {
        x: Math.floor(domX * ratioX),
        y: Math.floor(domY * ratioY),
    }
}

// =====
interface IPixelValue {
    r: number,
    g: number,
    b: number,
    a: number,
}

// =====
interface IPixelValueByNumberParams {
    pixelNumber: IPixelNumber
    imageReference: HTMLCanvasElement
    imageData: Uint8ClampedArray
}
function getPixelValueByNumber({pixelNumber, imageReference, imageData}: IPixelValueByNumberParams): IPixelValue {
    const pixel = pixelNumber.y * imageReference.width + pixelNumber.x
    const position = pixel * 4

    return {
        r: imageData[position],
        g: imageData[position + 1],
        b: imageData[position + 2],
        a: imageData[position + 3],
    }
}

// =====
interface IupdateEffectParams {
    canvasForEffectRender_ctx: CanvasRenderingContext2D;
    canvasForBackground_imageData: ImageData;
    canvasForEffectRender_imageData: ImageData;
    pixelNumberOfMouseOver: IPixelNumber;
    canvasForImage: HTMLCanvasElement;
    canvasForImage_imageData: ImageData;
    threshold: number;
}
function updateEffect({canvasForEffectRender_ctx, canvasForBackground_imageData, canvasForEffectRender_imageData, pixelNumberOfMouseOver, canvasForImage, canvasForImage_imageData, threshold}: IupdateEffectParams) {

    const colorReference =
        getPixelValueByNumber({
            pixelNumber : pixelNumberOfMouseOver,
            imageReference : canvasForImage,
            imageData: canvasForImage_imageData.data,
        })

    for (let i=0;i<canvasForImage_imageData.data.length;i+=4) {
        const pixelInImage = {
            r: canvasForImage_imageData.data[i],
            g: canvasForImage_imageData.data[i+1],
            b: canvasForImage_imageData.data[i+2],
            a: canvasForImage_imageData.data[i+3],
        }

        const samePixel =
            valueIsBetweenTwo({
                value: pixelInImage.r, min: colorReference.r - threshold, max: colorReference.r + threshold
            })
            && valueIsBetweenTwo({
                value: pixelInImage.g, min: colorReference.g - threshold, max: colorReference.g + threshold
            })
            && valueIsBetweenTwo({
                value: pixelInImage.b, min: colorReference.b - threshold, max: colorReference.b + threshold
            })


        if (!samePixel) {
            canvasForEffectRender_imageData.data[i]     = canvasForImage_imageData.data[i]
            canvasForEffectRender_imageData.data[i + 1] = canvasForImage_imageData.data[i + 1]
            canvasForEffectRender_imageData.data[i + 2] = canvasForImage_imageData.data[i + 2]
            canvasForEffectRender_imageData.data[i + 3] = canvasForImage_imageData.data[i + 3]
        } else {
            canvasForEffectRender_imageData.data[i]     = canvasForBackground_imageData.data[i]
            canvasForEffectRender_imageData.data[i + 1] = canvasForBackground_imageData.data[i + 1]
            canvasForEffectRender_imageData.data[i + 2] = canvasForBackground_imageData.data[i + 2]
            canvasForEffectRender_imageData.data[i + 3] = canvasForBackground_imageData.data[i + 3]
        }
    }

    canvasForEffectRender_ctx.putImageData(
        canvasForEffectRender_imageData,
        0,
        0,
    )
}