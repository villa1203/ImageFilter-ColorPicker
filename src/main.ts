import './style.css'


async function main() {
    const threshold = 20

    const imageForEffect        = document.querySelector('.image-effect--image')
    const backgroundForEffect   = document.querySelector('.image-effect--background')
    const canvasContainer       = document.querySelector('.image-effect--canvas-container')

    if (!(imageForEffect        instanceof HTMLImageElement))   return
    if (!(backgroundForEffect   instanceof HTMLImageElement))   return
    if (!(canvasContainer       instanceof HTMLDivElement))     return

    const canvasForEffectPixelValue             = await createCanvasByImage(imageForEffect)
    const canvasForEffectPixelValue_ctx         = canvasForEffectPixelValue.getContext('2d')!
    const canvasForEffectPixelValue_imageData   = canvasForEffectPixelValue_ctx.getImageData(0, 0, canvasForEffectPixelValue.width, canvasForEffectPixelValue.height)

    const canvasForEffectRender             = await createCanvasByImage(imageForEffect)
    const canvasForEffectRender_ctx         = canvasForEffectRender.getContext('2d')!
    const canvasForEffectRender_imageData   = canvasForEffectRender_ctx.getImageData(0, 0, canvasForEffectPixelValue.width, canvasForEffectPixelValue.height)

    canvasContainer.appendChild(canvasForEffectRender)
    canvasForEffectRender.addEventListener('mousemove', (e: MouseEvent) => {
        const pixelNumberOfMouseOver = getPixelNumberByPosition({
            poseX: e.x,
            poseY: e.y,
            imageReference: imageForEffect,
            canvasRenderer: canvasForEffectRender,
        })

        const colorReference =
            getPixelValueByNumber({
                pixelNumber : pixelNumberOfMouseOver,
                imageReference : canvasForEffectPixelValue,
                imageData: canvasForEffectPixelValue_imageData.data,
            })

        console.log(colorReference)

        for (let i=0;i<canvasForEffectPixelValue_imageData.data.length;i+=4) {
            const pixelInImage = {
                r: canvasForEffectPixelValue_imageData.data[i],
                g: canvasForEffectPixelValue_imageData.data[i+1],
                b: canvasForEffectPixelValue_imageData.data[i+2],
                a: canvasForEffectPixelValue_imageData.data[i+3],
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


            if(samePixel) {
                canvasForEffectRender_imageData.data[i]   = 0
                canvasForEffectRender_imageData.data[i+1] = 0
                canvasForEffectRender_imageData.data[i+2] = 0
                canvasForEffectRender_imageData.data[i+3] = 255
            }
        }

        canvasForEffectRender_ctx.putImageData(
            canvasForEffectRender_imageData,
            0,
            0,
        )
        canvasContainer.style.backgroundColor = `rgba(${colorReference.r}, ${colorReference.g}, ${colorReference.b}, ${colorReference.a})`
    })
}
main()

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

interface IPixelValueByNumberParams {
    pixelNumber: IPixelNumber
    imageReference: HTMLCanvasElement
    imageData: Uint8ClampedArray
}

function getPixelValueByNumber({pixelNumber, imageReference, imageData}: IPixelValueByNumberParams): IPixelValue {
    const pixel = pixelNumber.y * imageReference.width + pixelNumber.x
    const position = pixel * 4

    console.log(pixelNumber.x, pixelNumber.y, '=>', pixel)
    return {
        r: imageData[position],
        g: imageData[position + 1],
        b: imageData[position + 2],
        a: imageData[position + 3],
    }
}
