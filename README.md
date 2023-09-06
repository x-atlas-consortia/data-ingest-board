# Data Ingest Board

## For Local Development

Create a file called `.env.local` in `/src` with the same structure as `example.env`. Modify the variables as needed

### Required services

The `ingest-api` must be running locally and you must change the variables `GLOBUS_CLIENT_APP_URI` and 
`DATA_INGEST_BOARD_APP_URI` to be `http://localhost:3000/` for redirects to work properly. You can start the 
`ingest-api` with the following command:

```
$ ingest-api/src/python app.py
```

To start the application run the following commands inside `/src`:\
**_Note:_** This application requires Node.js 18 or later

```
$ npm install
$ npm run all
```

## Usage 

This app provides a view of all current primary datasets and uploads. At a glance, users can see information about these
entities such as Group Name, Last Modified, Title, and, importantly, Status. Toggle view between displaying Datasets
and Uploads with the `switch` button. Each column can be sorted. Group Name, Status, Data Types, and Organ can be 
filtered by value for Datasets, and for organs, users can filter by Group Name and Status. 

## Authentication

Upon visiting the app, clicking "Log in" will redirect users to Globus to chose their institution. Once logged in with 
their institution credentials, users will be redirected back to the page. HuBMAP Read access is required to view the 
data. 