# Deploy rápido del front (Next.js) — build EN el mismo 88/web, sin carpeta
# intermedia. Pensado para correr directo en el servidor, en la fase de pruebas
# donde se necesitan iteraciones rápidas y frecuentes.
#
# Reemplaza el flujo manual anterior (parar servicios, borrar .next y el
# contenido de la api/web, subir zips compilados desde local, reiniciar) por:
# git pull -> borrar .next -> build -> pm2 restart. Sin subir nada desde tu
# máquina — el código ya vive en git, solo se trae el diff.
#
# Ajustar $RutaWeb y $Pm2App antes de usar en el servidor.

$ErrorActionPreference = "Stop"

$RutaWeb = "C:\ruta\a\88\web"   # TODO: ajustar a la ruta real en el servidor
$Pm2App  = "front88"            # TODO: ajustar al nombre real del proceso en pm2

Set-Location $RutaWeb

Write-Output "== git pull =="
git pull

Write-Output "== borrando .next =="
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

# Si cambió package.json/package-lock.json, correr acá "npm ci" antes del
# build — no se hace en cada corrida para no perder la velocidad de iterar.
# npm ci

Write-Output "== npm run build =="
npm run build

Write-Output "== pm2 restart $Pm2App =="
pm2 restart $Pm2App

Write-Output "== listo =="
