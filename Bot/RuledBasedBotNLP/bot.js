// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const { MessageFactory } = require('botbuilder');
var request = require("request");

class EchoBot extends ActivityHandler {
    
    
    
    constructor() {
        super();
        var location = ''
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            
            
            if (context.activity.text && context.activity.text.toLowerCase().includes("report")){
                await context.sendActivity(MessageFactory.suggestedActions(['Human Trafficking', 'Get Report', 'Call law and enforcements'], 'What kind of case would you like to report?'));
            }else if (context.activity.text && context.activity.text.toLowerCase().includes("traf")){
                await context.sendActivity(MessageFactory.suggestedActions(['location: Pestalozzistrasse 3, 8032 Zurich', 'Other'], 'Would you like to use your current location?'));
                
            }else if (context.activity.text && context.activity.text.toLowerCase().includes("location")){
                location = context.activity.text.split(":")[1];
                await context.sendActivity(`Could you please snap photo of incident?`);
            }else if (context.activity.attachments && context.activity.attachments.length > 0){
                console.log(context.activity.attachments[0]['contentUrl']);
                var options = { method: 'POST',
                      url: 'http://40.68.184.28:8081/',
                      headers: 
                       { 'postman-token': '53dcd83d-c944-1514-f7b0-5cb930fbd8a5',
                         'cache-control': 'no-cache',
                         'content-type': 'application/json' },
                      body: 
                       { location: 'Pestalozzistrasse 3, 8032 Zürich',
                         url:context.activity.attachments[0]['contentUrl'] },
                      json: true };
                    
                    request(options, function (error, response, body) {
                      if (error) throw new Error(error);
                    
                      console.log(body);
                    });

                await context.sendActivity(`Any further comments`);
            }else if (context.activity.text && context.activity.text.toLowerCase().includes("no")){
                await context.sendActivity(`Many thanks, incident recorded.`);
            }else{
                await context.sendActivity(`Hi, thanks for using my services for betterment of society`);
            }
            

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Hello and welcome!');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
