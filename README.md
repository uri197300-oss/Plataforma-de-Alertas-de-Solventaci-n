# Plataforma de Alertas de Solventación — DGCH

Plataforma gubernamental full-stack para la gestión, seguimiento e innovación en los plazos de solventación de observaciones de dependencias públicas. Desarrollada por el **Departamento de Innovación Administrativa (DGCH)**.

Esta plataforma permite llevar un control riguroso de las fechas de alerta y plazos límite oficiales de presentación, permitiendo además redactar apercibimientos y notificaciones asistidas por Inteligencia Artificial (Gemini API) con un tono configurable y formalidad institucional.

---

## 🚀 Características Principales

1. **Acceso Seguro Administrativo**:
   - Resguardo de la plataforma mediante autenticación de Oficialía con clave de auditor.
   - Credenciales pre-configuradas para acceso institucional.
2. **Tablero de Control en Tiempo Real**:
   - Clasificación inteligente por estados: `Al Corriente` (✅), `Alerta Activa` (⚠️), `Plazo Vencido` (🚨) y `Solventado` (⭐).
   - Cálculo automático de días restantes con alertas visuales dinámicas.
3. **Registro Manual & Edición Dinámica**:
   - Permite dar de alta dependencias con su Nombre, Encargado Administrativo (titular), Correo de Contacto Oficial, Fecha de Alerta y Fecha Límite.
   - Modificación completa de datos directamente desde el panel lateral, garantizando adaptabilidad ante cambios de encargado administrativo.
   - Eliminación de registros o vaciado completo de la base de datos para inicio limpio.
4. **Redactor de Alertas con Inteligencia Artificial (Gemini SDK)**:
   - Redacción inteligente y formalizada de oficios, seleccionando observaciones de la dependencia, tono deseado (cordial, urgente, formal-enérgico, último aviso) y firmas institucionales personalizadas.
   - Copiado con un solo clic o simulación segura de envío por correo electrónico gubernamental.
5. **Bitácora de Corresos Enviados**:
   - Registro histórico persistente local de todas las notificaciones emitidas con fecha, destinatario, asunto y cuerpo del mensaje.

---

## 🛠️ Tecnologías y Arquitectura

La aplicación utiliza un diseño **Full-Stack integrado**:
* **Frontend (SPA)**: React 18, TypeScript, Tailwind CSS, Lucide React (iconos), Framer Motion (animaciones de interfaz).
* **Servidor Frontend**: Bundling rápido con Vite.
* **Backend**: Express (Node.js) con soporte nativo de TypeScript ejecutado mediante `tsx` en desarrollo y compilado ultra-eficiente con `esbuild` para producción.
* **Persistencia**: Archivos locales JSON autogestionados (`records.json` y `email_logs.json`) para una portabilidad absoluta en despliegues ligeros dentro de contenedores (Cloud Run).

---

## 📋 Requisitos Previos

* **Node.js** v18 o superior.
* **npm** v9 o superior.
* Una clave API de Google AI Studio (**Gemini API Key**) para habilitar las características del redactor con IA.

---

## ⚙️ Configuración Inicial

1. Clona este repositorio en tu máquina local:
   ```bash
   git clone https://github.com/tu-usuario/plataforma-solventacion-dgch.git
   cd plataforma-solventacion-dgch
   ```

2. Instala todas las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Duplica el archivo de variables de entorno de ejemplo y configúralo:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` y define tu clave de Gemini:
   ```env
   GEMINI_API_KEY="TU_CLAVE_GEMINI_AQUI"
   ```

---

## 💻 Instrucciones de Uso y Scripts

### Modo Desarrollo
Inicia el servidor backend en Express y el frontend con Vite integrado:
```bash
npm run dev
```
La aplicación estará disponible de inmediato en http://localhost:3000.

### Compilación para Producción
Compila el frontend estático a la carpeta `dist/` y empaqueta el servidor backend completo a un único archivo optimizado CommonJS (`dist/server.cjs`):
```bash
npm run build
```

### Ejecutar en Producción
Inicia el servidor compilado de alto rendimiento:
```bash
npm start
```

---

## ☁️ Despliegue en GitHub Pages con Firebase (Modo Cliente-Solo)

Para que la aplicación funcione en **GitHub Pages** (donde no es posible ejecutar un servidor backend Express tradicional), la plataforma ha sido actualizada con un **Modo Dual Avanzado** con soporte nativo de **Firebase Firestore**:

1. **Estructura Firestore**:
   - Crea un proyecto en la consola de Firebase.
   - Crea una base de datos Cloud Firestore en producción.
   - Aplica las reglas definidas en el archivo local `firestore.rules` (o cópialas a la sección "Rules" de tu consola de Firebase).

2. **Variables de Entorno para GitHub Actions / Vite / Vercel**:
   Para alimentar la conexión web cliente directa con tu base de datos de Firebase en lugar de usar Express, configura los secretos del repositorio en GitHub o agrégalos a tu archivo `.env` de producción con el prefijo `VITE_`:
   ```bash
   VITE_FIREBASE_API_KEY="tu-api-key-de-firebase"
   VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="tu-proyecto-id"
   VITE_FIREBASE_FIRESTORE_DATABASE_ID="(default) o id-especifico"
   VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="sender-id"
   VITE_FIREBASE_APP_ID="app-id"
   VITE_GEMINI_API_KEY="tu-gemini-api-key" # Para activar la IA del redactor directamente desde el navegador
   ```

3. **Publicación automatizada con GitHub Actions**:
   Puedes crear un flujo de trabajo en `.github/workflows/deploy.yml` para compilar y desplegar a GitHub Pages en cada push:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   permissions:
     contents: write
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         - name: Install dependencies
           run: npm ci
         - name: Build SPA
           env:
             VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
             VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
             VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
             VITE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
             VITE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
             VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
             VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
           run: npm run build
         - name: Deploy to GitHub Pages
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: dist
   ```

---

## 🔐 Credenciales de Acceso Administrador

Para ingresar y administrar el panel, inicie sesión en la pantalla de autenticación con las siguientes claves autorizadas por la DGCH:

| Campo | Valor de Acceso Autorizado |
| :--- | :--- |
| **Correo Institucional** | `Uri197300@gmail.com` |
| **Clave de Despacho Auditor** | `#DGCH2026_Alertas` |

---

## 🏛️ Créditos e Identidad

* **Organismo**: Dirección de Cuenta Pública y Fiscalización
* **Departamento**: Departamento de Innovación Administrativa
* **Dirección General**: DGCH
* **Titular Responsable**: Donají Razo
