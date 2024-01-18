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

You can change the port of the app (and can subsequently change the py configs above to match) by running:
```
npm run dev -- -p 3001
```

## Usage 

This app provides a view of all current primary datasets and uploads. At a glance, users can see information about these
entities such as Group Name, Last Modified, Title, and, importantly, Status. Toggle view between displaying Datasets
and Uploads with the `switch` button. Each column can be sorted. Group Name, Status, Data Types, and Organ can be 
filtered by value for Datasets, and for organs, users can filter by Group Name and Status. 

## Authentication

Upon visiting the app, clicking "Log in with your institution credentials" will redirect users to Globus to chose their institution. Once logged in with 
their institution credentials, users will be redirected back to the page. HuBMAP/SenNet Read access is required to view the 
data. 

## Content Management
### Banner 
Currently, two locations offer adding a banner via the `.env` file without having to rebuild the image. These are:
```
NEXT_PUBLIC_BANNER_LOGIN # This is located before the Login section
NEXT_PUBLIC_BANNER_SEARCH_ENTITIES # Located right before the main search results area
```
These environment variables take a json object with the following properties:

| Property                  | Type          | Description                                                                                                         |
|---------------------------|---------------|---------------------------------------------------------------------------------------------------------------------|
| **theme**                 | *enum string* | `['info', 'danger', 'warning']`                                                                                     |
| **title**                 | *html string* | A title for the `Alert`, which is the actual banner. (Going forward we will call this just 'banner'.)               |
| **content**               | *html string* | The main banner content.                                                                                            |
| **dismissible**           | *boolean*     | Add a close button to the banner.                                                                                   |
| **keepDismissed**         | *boolean*     | Keep the banner dismissed on close. The banner will show again on refresh if this is set to `false` or `undefined`. |
| **className**             | *string*      | A class name for the banner.                                                                                        |
| **innerClassName**        | *string*      | A class name for inner wrapper of the banner.                                                                       |
| **outerWrapperClassName** | *string*      | A class name for the div that wraps the banner.                                                                     |
| **beforeBanner**          | *html string* | Set some content before the banner.                                                                                 |
| **beforeBannerClassName** | *string*      | Set a class name on div of `beforeBanner`.                                                                          |
| **afterBanner**           | *html string* | Set some content after the banner.                                                                                  |
| **afterBannerClassName**  | *string*      | Set a class name on div of `afterBanner`.                                                                           |
| **sectionClassName**      | *string*      | A class name for the `c-AppBanner` section.                                                                         |
| **ariaLabel**             | *string*      | For accessibility, add a unique label to the `c-AppBanner` section                                                  |