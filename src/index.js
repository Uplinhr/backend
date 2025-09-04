import app from './app.js'

const PORT = app.get('port')
app.listen(PORT, () => {
    console.log("🚀 Servidor ejecutándose en puerto:", PORT);
    console.log("📊 Entorno:", process.env.NODE_ENV || 'development');
}).on('error', (err) => {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
});