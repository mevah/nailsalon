# PinPoint Hat

===

## Technologies Used

1. Scikit-learn for Machine Leanring 
2. Bootstrap, JavaScript
3. Flask (Backend Server)
4. Azure Bot Framework NodeJS V4
5. Azure Virtual Machine for hosting Webapp
6. Python/ R for Data Analysis
7. NLTK and Azure cognitive Services for natural language processing
8. Azure cognitive services Computer Vision and Text Analysis
9. Google Cloud AutoML tabular 
10. Google Maps Platform, Geocoding

===

## Folder Structure 

1. ReportingDashboard: Reporting Dashboard source code for incident report generation
2. Bot: Source code for Azure bot framework and Azure cognitive services 
3. BackendServer: Flask based backend server for answering request from bot and serving as backend of reporting backend
4. Analysis: Data analysis source code 
5. docs: Documents
6. Reuters_Data_Full.ipynb - python notebook that loads entites from Google Maps in certain area, then loads the news articles that are related to slavory and contains those entity. For each entity the score is output as a sentiment (using Azure cognitive services Text Analysis) of how positive or negative is the news for this entity.
