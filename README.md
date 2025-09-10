# 🚀 Backend - UPLIN

Este repositorio contiene el código fuente del backend del proyecto **UPLIN**. Desarrollado durante 1 mes y medio por Marco Pistagnesi, en colaboración con Gastón Orellano y Tomás Ulman

---

## 📌 Objetivo

Este proyecto tiene como objetivo ser un complemento de las funcionalidades backend limitadas de systeme.io, utilizando al mismo para la pasarela de pagos e información de contacto de clientes, y brindando beneficios como la posibilidad de loguearse en la plataforma, guardar la información específica de cada usuario y permitir realizar solicitudes de búsqueda y de consultoría. El segundo objetivo es que, una vez finalizado el tiempo de desarrollo impuesto en el startup, quede en un estado funcional, y a la vez, legible y escalable para el equipo que se encargue de seguir desarrollándolo en una segunda instancia

--- 

## 🔧 Instrucciones

En caso de querer iniciar el proyecto, instalar <a href="https://dev.mysql.com/downloads/installer">MySQL</a> en forma local (Se recomienda agregar en las variables de entorno) y ejecutar los siguientes comandos:

**`git clone https://github.com/Uplinhr/backend.git`** (descargar el repositorio)

**`cd backend`** (acceder a la carpeta del proyecto)

**`npm i`** (instalar las dependencias en npm)

**`npm run migrate`** (ejecutar las migraciones)

**`npm run seeders`** (ejecutar los seeders)

**`npm run dev`** (iniciar el backend)

Antes de iniciar el backend, asegurarse de tener configuradas las variables de entorno, para eso debe generar el archivo: “.env” con la siguiente información:

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=admin

DB_NAME=uplindb

PORT=4000

JWT_SECRET=claveAuthPista

DEV=true

MAIL_API_KEY=re_aDh93bUh_DbsA2Lc4wwYk3VKVBwonAHcY

EMAIL_FROM=noreply@noreply.uplinhr.com

FRONTEND_URL=http://localhost:3000

SERVER_PORT=4000

Tenga en cuenta que “DB_USER” y “DB_PASSWORD” debe coincidir con los datos de su cuenta al momento de instalar MySQL en forma local, y “DB_NAME” es el nombre que tendrá la base de datos en su sistema cuando ejecute las migraciones


En caso de necesitar reiniciar la base de datos localmente, debe eliminar el archivo con la dirección: “src/database/seeders/executed.json” ejecutar los siguientes comandos:
mysql -u [usuario] -p (Ingresar a la consola de MySQL, al ejecutar, va a solicitar la contraseña de la cuenta)
DROP DATABASE IF EXISTS [DB_NAME]; (Eliminar la base de datos en caso de existir)
A continuación, debe volver a ejecutar:
npm run migrate (ejecutar las migraciones)
npm run seeders (ejecutar los seeders)
npm run dev (iniciar el backend)
El sistema de migraciones se encuentra en la dirección: “src/database/run-migrations.js” y actúa sobre la carpeta “migrations”. El de seeders se encuentra en la misma dirección que las migraciones pero con nombre: “run-seeders.js”, y actúa sobre la carpeta: “seeders”
