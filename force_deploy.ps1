REM Initialize git
git init

REM Add all files
git add .

REM Commit
git commit -m "Deploy Thalexa V2 - Complete project with contracts, frontend, backend, docs"

REM Add remote (if not already)
git remote add origin https://github.com/EmmyPencilAI/Thalexa-Sui.git

REM Create main branch and FORCE PUSH
git branch -M main
git push -u origin main --force


