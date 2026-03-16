const express = require("express")
const cors = require("cors")
const youtubedl = require("youtube-dl-exec")
const ffmpegPath = require("ffmpeg-static")

const app = express()
app.use(cors())

function limpiarURL(url){

    const match = url.match(/v=([^&]+)/)

    if(match){
        return "https://www.youtube.com/watch?v=" + match[1]
    }

    return url
}

app.get("/formats", async (req, res) => {

    let url = decodeURIComponent(req.query.url)
    url = limpiarURL(url)
    // url = url.split("&")[0]

    try {

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            geoBypass: true,
            noCheckCertificates: true,
            addHeader: [
                "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "referer:https://www.youtube.com/"
            ]
        })


        const formats = info.formats
            .filter(f => f.ext === "mp4" && f.height && f.vcodec !== "none")
            .map(f => ({
                calidad: f.height + "p",
                id: f.format_id,
                height: f.height
            }))
            .sort((a,b)=>b.height-a.height)

        res.json({
            titulo: info.title,
            miniatura: info.thumbnail,
            formatos: formats
        })

    } catch (err) {

        console.log(err)

        res.status(500).json({
            error: err.message
        })
    }

})

app.get("/download", async (req, res) => {

    try {

        let url = limpiarURL(req.query.url)
        const format = req.query.format

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true
        })

        const title = info.title.replace(/[^\w\s]/gi, "")

        const stream = youtubedl.exec(url, {
            format: `${format}+bestaudio/best`,
            output: "-",
            mergeOutputFormat: "mp4",
            ffmpegLocation: ffmpegPath
        })

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${title}.mp4"`
        )

        stream.stdout.pipe(res)

        stream.stderr.on("data", console.error)

    } catch(err) {

        console.log(err)
        res.status(500).send("Error descargando")

    }

})

app.get("/downloadmp3", (req, res) => {

    let url = limpiarURL(req.query.url)

    const stream = youtubedl.exec(url, {
        extractAudio: true,
        audioFormat: "mp3",
        output: "-"
    })

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="audio.mp3"`
    )

    stream.stdout.pipe(res)

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Servidor corriendo en " + PORT)
})