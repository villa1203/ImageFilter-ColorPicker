import {CanvasSpace, Img} from 'pts'

export async function main() {
    const space = new CanvasSpace('#pts-canvas')
    const form = space.getForm()

    space.setup({
        resize: false,
        bgcolor: 'white',
    })


    const resultImage = new Image(space.width, space.height)
    const imgBackground = await Img.loadAsync("https://source.unsplash.com/random/?sky,blue,cloud")


    space.add(() => {
        form.image([0, 0, space.width, space.height], imgBackground)
    })

    space.bindMouse().bindTouch().play()

    console.log( resultImage )
}