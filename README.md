# WayFinder

## Installation

To be able to run WayFinder you need to:

- Install jdkName="Python 3.9" jdkType="Python SDK"

- Build virtual environment for the directory:
```bash
python -m venv env
```

- Install Django framework :
```bash
pip install django
```
- Install npm

- Connect via OpenVPN to connect to the database (Instruction for connecting through UAM OpenVPN: https://laboratoria.wmi.amu.edu.pl/uslugi/vpn/windows/connect/)

## Starting development server:

To run locally backend app use commands:
```
cd WayFinder/WayFinder
python .\manage.py runserver
```

To run locally frontend app, use commands:
```
cd WayFinder/WayFinder/frontend
npm start
```
If npm is not installed, use command:
```
sudo apt update
sudo apt install nodejs npm
```
App is available at http://localhost:3000/

To run test suites:
```
cd WayFinder/WayFinder/frontend
npm test
```

WARNING:
If you're getting error: ModuleNotFoundError: No module named 'rest_framework', run :

```bash
pip install djangorestframework
```


We use django-environ package to manage .env in Django for keeping sensitive data needed for connecting in our application:
```bash
pip install django-environ
```
