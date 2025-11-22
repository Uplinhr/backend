# 🚀 Backend - UPLIN

Este repositorio contiene el código fuente del backend del proyecto **UPLIN**. Desarrollado durante 1 mes y medio por Marco Pistagnesi, en colaboración con Gastón Orellano y Tomás Ulman

---

## 📌 Objetivo

Este proyecto tiene como objetivo ser un complemento de las funcionalidades backend limitadas de <a href="http://systeme.io">systeme.io</a>, utilizando al mismo para la pasarela de pagos e información de contacto de clientes, y brindando beneficios como la posibilidad de loguearse en la plataforma, guardar la información específica de cada usuario y permitir realizar solicitudes de búsqueda y de consultoría. El segundo objetivo es que, una vez finalizado el tiempo de desarrollo impuesto en el startup, quede en un estado funcional, y a la vez, legible y escalable para el equipo que se encargue de seguir desarrollándolo en una segunda instancia

--- 

## 🔧 Instrucciones

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Uplinhr/backend.git
   cd backend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**:
   Copiar el archivo `.env.example` a `.env` y completar los valores necesarios (Base de datos, Auth0, Pagos, etc.).
   ```bash
   cp .env.example .env
   ```

4. **Base de Datos (Prisma)**:
   Asegurarse de tener PostgreSQL corriendo y la variable `DATABASE_URL` configurada.
   ```bash
   npm run prisma:generate  # Generar cliente de Prisma
   npm run prisma:deploy    # Aplicar migraciones a la BD
   # Opcional: npm run prisma:seed  # Poblar BD con datos de prueba
   ```

5. **Iniciar el Servidor**:
   ```bash
   npm run dev   # Modo desarrollo
   npm start     # Modo producción
   ```

Para más detalles sobre la configuración y variables de entorno, ver [INFORME_BACKEND.md](./INFORME_BACKEND.md).


---

## ⚙️ Rutas

Las rutas del proyecto se definien en el archivo: **`“routes,js”`** dentro de la carpeta de cada tabla. Cuando la ruta ejecuta la función: **`“authRequired”`** verifica que el usuario tenga la sesión iniciada; Cuando la ruta ejecuta la función: **`“checkRole([rol])”`**, el sistema verifica que el usuario tenga el rol indicado.
- Rutas de usuarios:
  * **`POST /api/auth/register`** Registra un nuevo usuario (body: nombre, apellido, email, contrasenia, [num_celular])
  * **`POST /api/auth/login`** Inicia sesión del usuario (body: email, contrasenia)
  * **`POST /api/auth/logout`** Cierra sesión
  * **`PUT /api/auth/editPassword/:id`** Edita la contraseña del propio usuario en caso de ser cliente, si es admin, cambia la de cualquier usuario (body: contrasenia)
  * **`GET /api/auth/checkLogin`:** verifica si el usuario está logueado y su sesión no expiró o es falsa
  * **`POST /api/auth/forgotPassword`** Envía un mail a una dirección de correo para poder reiniciar la contraseña (body: email)
  * **`POST /api/auth/validateToken`** Verifica si el token de reinicio de contraseña es válido (body: token) (El token no es el mismo que el de inicio de sesión)
  * **`POST /api/auth/resetPassword`** Reinicia la contraseña del usuario y marca el token como usado (body: contrasenia, token)
  * **`GET /api/usuarios/self`** Responde con el usuario propio junto con su plan, su empresa, sus créditos y solicitudes de búsquedas, y sus datos de consultoría y solicitudes de
    consultoría
  * **`PUT /api/usuarios/fullName/:id`** Modifica el nombre y apellido del usuario propio en caso de ser cliente, si es admin, cambia el de cualquier usuario (body: nombre, apellido)
  * **`GET /api/usuarios`** Responde con la lista de usuarios junto con su plan, empresa, tablas de créditos y de consultorías
  * **`GET /api/usuarios/:id`** Responde con el usuario especificado en los parámetros junto con su plan, empresa, creditos y solicitudes de búsquedas, y sus datos de consultoría y
    solicitudes de consultoría
  * **`PUT /api/usuarios/:id`** Modifica el usuario con el id especificado en los parámetros, al modificar el plan, se crean nuevos registros de créditos y de consultorías asociados
    al usuario (body: nombre, apellido, email, active, rol, id_plan)
  * **`DELETE /api/usuarios/:id`** Elimina el usuario especificado en los parámetros en forma lógica, es decir, setea la variable: “active” en false.
  * **`PUT /api/usuarios/enable/:id`** setea la variable: “active” en true del usuario especificado en los parámetros, deshaciendo así la eliminación del mismo
- Rutas de planes:
  * **`GET /api/planes`** Responde con la lista completa de planes.
  * **`GET /api/planes/:id`** Responde con el plan especificado en los parámetros
  * **`PUT /api/planes/:id`** Modifica el registro del plan especificado en los parámetros (body: nombre, creditos_mes, meses_cred, horas_cons, precio, active, custom)
  * **`POST /api/planes`** Crea un nuevo plan (body: nombre, creditos_mes, meses_cred, horas_cons, precio, custom)
  * **`DELETE /api/planes/:id`** Elimina el plan especificado en los parámetros en forma lógica, es decir, setea la variable: “active” en true.
  * **`PUT /api/planes/enable/:id`** setea la variable: “active” en true del plan especificado en los parámetros, deshaciendo así la eliminación del mismo
  * **`POST /api/planes/renew`** Renueva el plan del usuario, creando así, nuevos registros de créditos y de consultorías y las asocia al usuario (body: id_plan, id_usuario)
- Rutas de compra_planes: (actualmente no utilizada por el sistema)
  * **`GET /api/compra_planes`** Responde con la lista completa de compras de planes junto con su usuario y su plan
  * **`GET /api/compra_planes/:id`** Responde con la compra de plan especificado en los parámetros junto con su plan y su usuario
  * **`PUT /api/compra_planes/:id`** Modifica un registro de compra de plan especificado por parámetro (body: medio_pago, observaciones, precio_abonado, id_plan, id_usuario)
  * **`POST /api/compra_planes`** Crea una nueva compra de plan (body: medio_pago, observaciones, precio_abonado, id_plan, id_usuario)
  * **`DELETE /api/compra_planes/:id`** Elimina en forma física la compra de plan especificada en los parámetros
- Rutas de empresas:
  * **`GET /api/empresas/self`** Responde con la empresa del usuario, junto con los datos del usuario asociado
  * **`PUT /api/empresas/self`** Modifica solo los datos permitidos de la empresa propia del usuario (body: nombre, email, nombre_fantasia, cuit, condicion_iva, tipo_societario,
    actividad_principal, domicilio_legal_calle_numero, domicilio_legal_ciudad, domicilio_legal_pais, codigo_postal)
  * **`GET /api/empresas`** Responde con la lista completa de empresas, junto con los datos del usuario asociado
  * **`GET /api/empresas/:id`** Responde con la empresa especificada en los parámetros, junto con su usuario asociado
  * **`PUT /api/empresas/:id`** Modifica los datos de la empresa especificada en los parámetros (body: nombre, email, nombre_fantasia, cuit, condicion_iva, tipo_societario, 
    actividad_principal, domicilio_legal_calle_numero, domicilio_legal_ciudad, domicilio_legal_pais, codigo_postal, id_usuario, active)
  * **`POST /api/empresas`** Crea una nueva empresa (body: nombre, email, nombre_fantasia, cuit, condicion_iva, tipo_societario, actividad_principal,
    domicilio_legal_calle_numero, domicilio_legal_ciudad, domicilio_legal_pais, codigo_postal, id_usuario)
  * **`DELETE /api/empresas/:id`** Elimina la empresa especificada en los parámetros en forma lógica, es decir, setea la variable: “active” en true
  * **`PUT /api/empresas/enable/:id`** setea la variable: “active” en true de la empresa especificada en los parámetros, deshaciendo así la eliminación del mismo
  * **`PUT /api/empresas/unlinkUser/:id`** Setea la variable: “id_usuario” en null de la empresa especificada en los parámetros, desasociando así la empresa del usuario
- Rutas de creditos:
  * **`GET /api/creditos/self`** Responde con todas las listas de créditos adicionales del usuario y la última de plan del usuario
  * **`GET /api/creditos`** Responde con la lista completa de créditos junto con sus búsquedas y sus compras de creditos asociadas
  * **`GET /api/creditos/:id`** Responde con los créditos especificados en los parámetros junto con sus búsquedas y sus compras de créditos asociadas
  * **`PUT /api/creditos/:id`** Modifica el registro de créditos especificado en los parámetros (body: tipo_credito, cantidad, vencimiento, id_usuario)
  * **`POST /api/creditos`** Crea un nuevo registro de créditos (body: tipo_credito, cantidad, vencimiento, id_usuario)
  * **`DELETE /api/creditos/:id`** Elimina en forma física el registro de créditos especificado en los parámetros
- Rutas de búsquedas:
  * **`GET /api/busquedas/self`** Responde con todas las búsquedas del usuario y sus registros de créditos y usuario asociados
  * **`GET /api/busquedas`** Responde con la lista completa de búsquedas junto con su usuario asociado
  * **`GET /api/busquedas/:id`** Responde con la búsqueda especificada en los parámetros junto con su registro de creditos y su usuario asociado
  * **`PUT /api/busquedas/:id`** Modifica la solicitud de búsqueda especificada en los parámetros, si la búsqueda se setea como: “Finalizado”, se restan los créditos del usuario
    (body: info_busqueda, creditos_usados, observaciones, estado, id_cred, id_tipo, id_proceso)
  * **`POST /api/busquedas`** Crea una nueva solicitud de búsqueda (body: info_busqueda, id_cred)
  * **`DELETE /api/busquedas/:id`** Setea la variable: “estado” en “Eliminado”, eliminando el registro en forma lógica y sumando los créditos consumidos
- Rutas de consultorías:
  * **`GET /api/consultorias/self`** Responde con la lista de consultoría y sus consultas del usuario
  * **`GET /api/consultorias`** Responde con la lista completa de consultorías junto con sus consultas asociadas
  * **`GET /api/consultorias/:id`** Responde con los datos de consultoría especificada en los parámetros junto con sus consultas asociadas
  * **`PUT /api/consultorias/:id`** Modifica el registro de consultoría especificado en los parámetros (body: horas_totales, horas_restantes, vencimiento, id_usuario)
  * **`POST /api/consultorias`** Crea un nuevo registro de créditos (body: horas_totales, horas_restantes, vencimiento, id_usuario)
  * **`DELETE /api/consultorias/:id`** Elimina en forma física el registro de consultoría especificado en los parámetros
- Rutas de consultas:
  * **`GET /api/consultas/self`** Responde con todas las consultas del usuario y sus registros de consultoría y usuario asociados
  * **`GET /api/consultas`** Responde con la lista completa de consultas junto con su usuario asociado
  * **`GET /api/consultas/:id`** Responde con la consulta especificada en los parámetros junto con su registro de consultoria asociado
  * **`PUT /api/consultas/:id`** Modifica la solicitud de consultoría especificada en los parámetros (body: cantidad_horas, comentarios, observaciones, estado, id_consultoria)
  * **`POST /api/consultas`** Crea una nueva solicitud de búsqueda (body: cantidad_horas, comentarios, id_consultoria)
  * **`DELETE /api/consultas/:id`** Setea la variable: “estado” en “Eliminado”, eliminando el registro en forma lógica y devolviendo las horas de consultoría

---

## 🧰 Tecnologías Utilizadas

- **`Node.js` & `Express`**: Core del backend.
- **`PostgreSQL`**: Base de datos relacional.
- **`Prisma ORM`**: Manejo de base de datos y migraciones.
- **`Auth0`**: Gestión de identidad y autenticación.
- **`MercadoPago` & `PayPal`**: Pasarelas de pago.
- **`Resend`**: Envío de emails.
- **`Cloudinary`**: Almacenamiento de imágenes.
- **`Winston`**: Logging avanzado.
- **`Node Cron`**: Tareas programadas (facturación).

Para un detalle exhaustivo de las tecnologías y servicios, consultar el archivo [INFORME_BACKEND.md](./INFORME_BACKEND.md).

---

## 📋 Tablas de la base de datos

- **`usuarios`**: Tabla principal de la BD, de la que se desprenden la mayoría de tablas, sus funcionalidades se dividen entre las carpetas: “usuarios” y “auth”.
  * id: Clave primaria **(INT)**
  * nombre: Nombre del usuario **(STRING)**
  * apellido: Apellido del usuario **(STRING)**
  * email: correo electrónico del usuario **(STRING) (UNIQUE)**
  * contrasenia: Contraseña hasheada del usuario **(STRING)**
  * id_plan: Clave foránea que refiere a la tabla: “planes” **(INT)**
  * fecha_alta: Fecha automática de la creación del registro **(DATE)**
  * active: Indica el estado del usuario, el borrado lógico actúa sobre éste dato **(BOOLEAN)**
  * num_celular: Número de teléfono del usuario (opcional) **(STRING)**
  * rol: Rol de usuario que define sus permisos, es un ENUM con las opciones: “cliente” o “admin” **(ENUM STRING)**
- **`planes`**: Define datos importantes para las tablas: “creditos” y “consultorias”
  * id: Clave primaria **(INT)**
  * nombre: Nombre del plan **(STRING) (UNIQUE)**
  * precio: Precio del plan **(DECIMAL)**
  * creditos_mes: Créditos que se le asigna al usuario al momento de la compra del plan, se utiliza para definir el dato: “cantidad” dentro de la tabla: “creditos” (INT)
  * horas_cons: Horas de consultoría que se le asigna al usuario al momento de la compra del plan, se utiliza para definir el dato: “horas_totales” dentro de la tabla: “consultas”
    **(INT)**
  * meses_cred: Los meses en los que se vencen los creditos asignados al usuario al momento de la compra del plan, se utiliza para definir: “fecha_vencimiento” en la tabla:
    “creditos” **(INT)**
  * active: Indica el estado del plan, el borrado lógico actúa sobre éste dato **(BOOLEAN)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro **(DATE)**
  * custom: Define si el registro es un plan personalizado **(BOOLEAN)**
- **`compra_planes`**: Almacena los datos compra de planes de clientes, no utilizado por el backend en ésta instancia, pero sus rutas y funcionalidades genéricas se encuentran creadas
  * id: Clave primaria **(INT)**
  * medio_pago: Método utilizado para el pago, sus valores pueden ser: “tarjeta”, “transferencia” **(ENUM STRING)**
  * observaciones: Información adicional de la compra proporcionada por un administrador **(STRING)**
  * precio_abonado: Decimal que indica lo que gastó el usuario **(DECIMAL)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * id_plan: Clave foránea que refiere a la tabla: “planes” **(INT)**
  * id_usuario: Clave foránea que refiere a la tabla: “usuarios” **(INT)**
- **`empresa`**: Almacena datos de la empresa asociada a un usuario
  * id: Clave primaria **(INT)**
  * nombre: Nombre de la empresa **(STRING)**
  * nombre_fantasia: Nombre fantasía de la empresa **(STRING)**
  * cuit: Clave Única de Identificación Tributaria de la empresa **(STRING) (UNIQUE)**
  * condicion_iva: Condición frente al IVA de la empresa, su valor puede ser: "Responsable inscripto", "Monotributista", "Exento", "No_Alcanzado" u "Otro" (ENUM STRING)
  * tipo_societario: Forma jurídica de la empresa, su valor puede ser: "SA", "SAU", "SRL", "SAS", "SCS", "SCA", "Cooperativa", "Asociacion civil", "Fundacion", "Sociedad de
    hecho", "Otro" **(ENUM STRING)**
  * actividad_principal: Giro o actividad económica principal **(STRING)**
  * domicilio_legal_calle_numero: Calle y número del domicilio legal **(STRING)**
  * domicilio_legal_ciudad: Ciudad del domicilio legal **(STRING)**
  * domicilio_legal_pais: País del domicilio legal **(STRING)**
  * codigo_postal: Código postal del domicilio de empresa **(STRING)**
  * email: Dirección de correo electrónico principal de la empresa **(STRING) (UNIQUE)**
  * active: Indica el estado de la empresa, el borrado lógico actúa sobre éste dato **(BOOLEAN)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro (DATE)
  * id_usuario: Clave foránea que refiere a la tabla: “usuarios” **(INT) (UNIQUE)**
- **`consultorias`**: Contiene la información de solicitudes de consultorías asociadas al cliente, cuando se crea un nuevo registro asociado al mismo usuario, el anterior deja de ser usado por el sistema pero se mantiene para tener un registro histórico
  * id: Clave primaria **(INT)**
  * horas_totales: Cantidad de horas de consultoría del usuario definidas al momento de la creación del registro **(INT)**
  * horas_restantes: Cantidad de horas disponibles del usuario, se va restando a medida que se crean registros de la tabla: “consultas” y se suma cuando el registro se elimina
    **(INT)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * vencimiento: Fecha creada con 1 mes de diferencia con respecto al momento de la creación del registro, hay filtrados que se realizan con éste dato **(DATE)**
  * id_usuario: Clave foránea que refiere a la tabla: “usuarios” **(INT)**
- **`consultas`**: Almacena los datos de la solicitud de consultoría creados por el cliente y consume de las horas de consultoría del mismo
  * id: Clave primaria **(INT)**
  * cantidad_horas: Horas consumidas de la tabla: “consultorias” asociada al usuario al momento de la creación del registro **(INT)**
  * comentarios: Información de la solicitud de consultoría proporcionada por el cliente **(STRING)**
  * observaciones: Información adicional de la solicitud de consultoría proporcionada por un administrador **(STRING)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro **(DATE)**
  * estado: Define el estado actual de la consulta, su valor puede ser: “Pendiente” al momento de la creación del registro, “En proceso”, “Finalizado” o “Eliminado” para indicar
    que se eliminó en forma lógica **(ENUM STRING)**
  * id_consultoria: Clave foránea que refiere a la tabla: “consultorias” **(INT)**
- **`creditos`**: Contiene la información de solicitudes de búsqueda asociadas al cliente, cuando se crea un nuevo registro asociado al mismo usuario, el anterior deja de ser usado por el sistema pero se mantiene para tener un registro histórico
  * id: Clave primaria **(INT)**
  * tipo_credito: Indica el tipo de tabla de crédito, sus valores pueden ser: “plan” en caso de que el registro sea al momento de asignar un plan, “devuelto” en caso de que el
    registro sea al momento de eliminar una búsqueda, o “adicional” en caso de que el registro sea al momento de comprar créditos **(ENUM STRING)**
  * cantidad: Indica cuántos créditos tiene el usuario en ésta tabla en particular **(INT)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * vencimiento: Fecha creada con los meses de diferencia provistos por el plan con respecto al momento de la creación del registro (Si no son de plan, no tienen vencimiento), hay
    filtrados que se realizan con éste dato **(DATE)**
  * id_usuario: Clave foránea que refiere a la tabla: “usuarios” **(INT)**
- **`busquedas`**:Contiene la información de solicitudes de búqueda asociadas al usuario, cuando se crea un nuevo registro de tipo: “plan” asociado al mismo usuario, el anterior deja de ser usado por el sistema pero se mantiene para tener un registro histórico
  * id: Clave primaria **(INT)**
  * info_busqueda: Información de la solicitud de búsqueda proporcionada por el cliente al momento de crear el registro **(STRING)**
  * creditos_usados: Creditos consumidos de la tabla de créditos del usuario, en una primera instancia se setea como null, luego un administrador define el dato según la
    información de la búsqueda. Cuando finaliza la búsqueda, resta su valor al atributo: “cantidad” dentro de la tabla de créditos, y si se elimina el registro, se le devuelven
    los créditos a la tabla **(INT)**
  * observaciones: Información adicional proporcionada por un administrador, en una primera instancia se crea en null, luego el administrador edita el registro y modifica éste
    dato **(STRING)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro **(DATE)**
  * estado: Define el estado actual de la búsqueda, su valor puede ser: “Pendiente” al momento de la creación del registro, “En proceso”, “Finalizado” o “Eliminado” para indicar
    que se eliminó en forma lógica **(ENUM STRING)**
  * id_cred: Clave foránea que refiere a la tabla: “creditos” **(INT)**
  * id_tipo: Clave foránea que refiere a la tabla: “tipo_busquedas” **(INT)**
  * id_proceso: Clave foránea que refiere a la tabla: “proceso_busquedas” **(INT)**
- **`compra_creditos`**:Almacena los datos compra de créditos adicionales de clientes, no utilizado por el backend en ésta instancia, pero sus rutas y funcionalidades genéricas se encuentran creadas
  * id: Clave primaria **(INT)**
  * costo: Cantidad que pagó el usuario al momento de comprar los créditos **(DECIMAL)**
  * medio_pago: Método utilizado para el pago, sus valores pueden ser: “tarjeta”, “transferencia” **(ENUM STRING)**
  * observaciones: Información adicional de la compra proporcionada por un administrador **(STRING)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * id_cred: Clave foránea que refiere a la tabla: “creditos” **(INT)**
- **`tipo_busquedas`**: Contiene los diferentes tipos de búsquedas que puede solicitar un cliente, **no utilizado por el backend en ésta instancia**
  * id: Clave primaria **(INT)**
  * nombre: Nombre del tipo de búsqueda **(STRING)**
  * creditos: Cantidad de créditos que consume solicitar éste tipo de búsqueda **(INT)**
  * active: Indica el estado del tipo de búsqueda, el borrado lógico actúa sobre éste dato **(BOOLEAN)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro **(DATE)**
- **`proceso_busquedas`**: Contiene los diferentes procesos de búsquedas que puede solicitar un cliente, **no utilizado por el backend en ésta instancia**
  * id: Clave primaria **(INT)**
  * etapa: Nombre del proceso de búsqueda **(STRING)**
  * descripción: Información más detallada sobre el proceso de búsqueda **(STRING)**
  * creditos: Cantidad de créditos que consume solicitar éste proceso de búsqueda **(INT)**
  * active: Indica el estado del proceso de búsqueda, el borrado lógico actúa sobre éste dato **(BOOLEAN)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * ultima_mod: Fecha creada automáticamente al momento de la creación del registro, se actualiza cada vez que se modifica el registro **(DATE)**
- **`reinicio_contrasenia`**: Guarda todas las solicitudes de reinicio de contraseñas de usuarios que la olvidaron
  * id: Clave primaria **(INT)**
  * email: Correo electrónico del usuario que busca restablecer su contraseña **(STRING)**
  * token: Llave de autenticación de reinicio de contraseña **(STRING)**
  * fecha_alta: Fecha creada automáticamente al momento de la creación del registro **(DATE)**
  * fecha_exp: Fecha que indica cuándo se vence la solicitud de reinicio de contraseña **(DATE)**
  * used: indica si la contraseña ya se restableció a través de éste registro, e impide que pueda utilizarse por segunda vez **(BOOLEAN)**
  * id_usuario: Clave foránea que refiere a la tabla: “usuarios” **(INT)**
 
---

## 🗂️ Estructura del Proyecto

El projecto se encuentra organizado de la siguiente forma:

```
backend/
├── src/                        # Código fuente del backend
│   ├── database/               # Código de la base de datos
│       ├── migrations/         # Querys SQL que ejecuta el sistema de migraciones
│       ├── seeders/            #Querys SQL que ejecuta el sistema de seeders
│       ├── database.js         #Configuración de la base de datos local de MySQL
│       ├── run-migrations.js   #Sistema de migraciones
│       └── run-seeders.js      #Sistema de seeders
│   ├── features/               # Lógica backend de cada tabla de la base de datos, cada una de ellas contiene los siguientes archivos:
        ├── controller.js       # Contiene la lógica de los endpoints y verifica los datos de entrada y salida.
        ├── index.js            # Es el nexo que exporta las demás funcionalidades.
        ├── model.js            # Contiene todas las consultas a la base de datos.
        └── routes.js           # Define las rutas.
│   ├── middlewares/            # Tipos e interfaces TypeScript
│       └── auth.js             # Sistema de autenticación de las rutas
│   ├── utils/                  # Archivos de utilidad
│       └── apiResponse.js      # Respuestas HTTP estandarizadas
│   ├── app.js                  # Tiene la lógica general de la aplicación.
│   ├── config.js               # Configura el puerto en el que se escuchan las peticiones.
│   └── index.js                # el primer archivo que se ejecuta, hace de nexo para todo el sistema
├── package.json                # Sistema de paquetes de NPM
├── vercel.json                 # Configuración para deployar en vercel
```
La carpeta auth dentro de features define las funcionalidades de usuario que se relacionen con el sistema de atuenticación de la aplicación.
