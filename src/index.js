import app from './app.js'

const PORT = app.get('port')
app.listen(PORT, () => {
    console.log("server en puerto: ", PORT)
})