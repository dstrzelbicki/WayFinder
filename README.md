# WayFinder

## Installation

To be able to run WayFinder you need to:

- Install jdkName="Python 3.9" jdkType="Python SDK"

- Install and create virtualenv:
```bash
py -m pip install --user virtualenv
py -m venv env
```

- Activate a virtualenv:
```bash
.\env\Scripts\activate 
```

- Install all dependencies from requirements file:
```bash
py -m pip install -r requirements.txt
```

- Install npm

- Connect via OpenVPN to connect to the database (Instruction for connecting through UAM OpenVPN: https://laboratoria.wmi.amu.edu.pl/uslugi/vpn/windows/connect/)

NOTE: 
All details and commands regarding installation for another system can be found on this page: [installing-using-pip-and-virtual-environments](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/)


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
We use django-environ package to manage .env in Django for keeping sensitive data needed for connecting in our application.