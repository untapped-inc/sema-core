# SEMA Core

SEMA Core is the API that connects the SEMA clients (POS, Back Office and Dashboard) to the SEMA Database.

---
## Requirements

For development, you will only need Node.js and a node global package manager, Yarn, installed in your environement.

You will also need to make sure the SEMA database is setup and running successfully on your development machine.

## Basic Usage

- Clone the repo and enter the project folder
```
git clone https://github.com/untapped-inc/sema-core
cd sema-core
```
- Copy the `.example-env` file to the parent directory as `.env`
```
cp .example-env ../.env
```
- Open `../.env` then edit it with your settings - from the SEMA Database setup. You will need:
	- DB_HOST: The URL to the database server location. E.g. localhost
	- DB_USER: The user who has access to this database. E.g. untapped
	- DB_PASSWORD: The user password for this database. E.g. semaIsAwesome
	- DB_SCHEMA: The actual name of the database/schema. E.g. sema_core
	- DB_DIALECT: The SQL dialect used by the DB. E.g. mysql
	- DEFAULT_TABLES: The tables that must be populated - postinstall - by sequelize-auto by default E.g. user,role,user_role. We recommend you keep it to the default value.
	- JWT_SECRET: JSON Web Token secret used to encrypt the token. E.g. f8d74387h8undgs87. Don't use this example, type in anything in there to make it hard to guess, this is some kind of password that will be used between the clients and the server.
	- JWT_EXPIRATION_LENGTH: Length of time the token is valid for. E.g. 1 day
	- BCRYPT_SALT_ROUNDS: How much time is needed to calculate a single BCrypt hash - Between 8 and 12 is recommended. Used for encrypting passwords for users. Remember, changing this requires that you use the same salt rounds value when creating a new password on the user table. E.g. 10
- Install dependencies:
```
yarn
```
- Run the server:
```
yarn start
```

It should start running at http://localhost:3001

- Test that it's running fine:
```
curl http://localhost:3001/sema/health-check
```
It should return something like: `{"server":"Ok","database":"Ok","version":"0.0.1.4","schema":"sema_core"}`

## Contributing

TODO

## Building for Production

For the full documentation on how to build/run this project in production mode, please, follow the tutorial [over there](https://untapped-inc.github.io/sema-docs/deploying-to-production/).
