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

## To run locally:

Starting development server: 
```bash
python manage.py runserver
```

WARNING:
If you're getting error: ModuleNotFoundError: No module named 'rest_framework', run :

```bash
pip install djangorestframework
```


We use django-environ package to manage .env in Django for keeping any secret or sensitive data needed for connecting in our application:
```bash
pip install django-environ
```