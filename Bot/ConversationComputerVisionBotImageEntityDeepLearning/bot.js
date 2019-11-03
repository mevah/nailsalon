// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const {
    ActivityTypes
} = require('botbuilder');
const {
    DialogSet,
    WaterfallDialog,
    NumberPrompt,
    DateTimePrompt,
    ChoicePrompt,
    DialogTurnStatus,
    AttachmentPrompt
} = require('botbuilder-dialogs');
const {
    MessageFactory
} = require('botbuilder');
// Define identifiers for our state property accessors.
const DIALOG_STATE_ACCESSOR = 'dialogStateAccessor';
const RESERVATION_ACCESSOR = 'reservationAccessor';
const RestaurantCard = require('./RestaurantCard.json');
const {
    ActivityHandler,
    CardFactory
} = require('botbuilder');

// Define identifiers for our dialogs and prompts.
const RESERVATION_DIALOG = 'reservationDialog';
const INCIDENT_TYPE_PROMPT = 'incidentType';
const LOCATION_PROMPT = 'locationPrompt';
const PHOTO_PROMPT = 'photoPrompt';
const RESERVATION_DATE_PROMPT = 'reservationDatePrompt';
const CONFIRM_PROMPT = 'confirmPrompt';
var request = require("request");


class DialogPromptBot {
    /**
     *
     * @param {ConversationState} conversation state object
     */
    constructor(conversationState) {
        // Creates our state accessor properties.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_ACCESSOR);
        this.reservationAccessor = conversationState.createProperty(RESERVATION_ACCESSOR);
        this.conversationState = conversationState;

        // Create the dialog set and add the prompts, including custom validation.
        this.dialogSet = new DialogSet(this.dialogStateAccessor);
        this.dialogSet.add(new ChoicePrompt(INCIDENT_TYPE_PROMPT));
        this.dialogSet.add(new ChoicePrompt(LOCATION_PROMPT));
        this.dialogSet.add(new AttachmentPrompt(PHOTO_PROMPT));
        this.dialogSet.add(new DateTimePrompt(RESERVATION_DATE_PROMPT, this.dateValidator));
        this.dialogSet.add(new ChoicePrompt(CONFIRM_PROMPT));

        // Define the steps of the waterfall dialog and add it to the set.
        this.dialogSet.add(new WaterfallDialog(RESERVATION_DIALOG, [
            this.promptForIncidentType.bind(this),
            this.promptForLocation.bind(this),
            this.promptForPhoto.bind(this),
            this.promptForReservationDate.bind(this),
            this.promptForConfirm.bind(this),
            this.acknowledgeReservation.bind(this),
        ]));
    }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        switch (turnContext.activity.type) {
            case ActivityTypes.Message:
                // Get the current reservation info from state.
                const reservation = await this.reservationAccessor.get(turnContext, null);
                    console.log(reservation)
                // Generate a dialog context for our dialog set.
                const dc = await this.dialogSet.createContext(turnContext);

                if (!dc.activeDialog) {
                    // If there is no active dialog, check whether we have a reservation yet.
                    console.log(reservation)
                    if (!reservation) {
                        // If not, start the dialog.
                        await dc.beginDialog(RESERVATION_DIALOG);
                    } else {
                        // Otherwise, send a status message.
                        await dc.beginDialog(RESERVATION_DIALOG);
                    }
                } else {
                    // Continue the dialog.
                    const dialogTurnResult = await dc.continueDialog();

                    // If the dialog completed this turn, record the reservation info.
                    if (dialogTurnResult.status === DialogTurnStatus.complete) {
                        console.log("ending")
                        await this.reservationAccessor.set(
                            turnContext,
                            dialogTurnResult.result);

                        var options = {
                            method: 'POST',
                            url: 'http://40.68.184.28:8081/',
                            headers: {
                                'postman-token': '53dcd83d-c944-1514-f7b0-5cb930fbd8a5',
                                'cache-control': 'no-cache',
                                'content-type': 'application/json'
                            },
                            body: {
                                location: dialogTurnResult.result.location,
                                url: dialogTurnResult.result.photo_url
                            },
                            json: true
                        };

                        request(options, function(error, response, body) {
                            if (error) throw new Error(error);

                            console.log(body);
                        });
                        // need to make request
                        // need to refresh page of maps 
                        //need to updae adaptive card
                        //export to csv of selected locations
                        //adding filters option into the dashboard and setting up basic dashbaord
                        //adding basic optimization for routing authoritties and sending emails and placing marker on map for itt
                        //cognitive services for visual inspection
                        //location based sentiment collection
                        //integrartion with financials

                        await turnContext.sendActivity(
                            `Thanks for reporting event`);

                        //  await turnContext.sendActivity({
                        //       text: 'Thank you, Incident reported. Please find more details below.',
                        //       attachments: [CardFactory.adaptiveCard(RestaurantCard)]
                        //   });



                    }
                }

                // Save the updated dialog state into the conversation state.
                await this.conversationState.saveChanges(turnContext, false);
                break;
            case ActivityTypes.EndOfConversation:
            case ActivityTypes.DeleteUserData:
                break;
            default:
                break;
        }
    }

    async promptForIncidentType(stepContext) {
        // Prompt for the party size. The result of the prompt is returned to the next step of the waterfall.
        return await stepContext.prompt(INCIDENT_TYPE_PROMPT, {
            prompt: 'What would you like to report?',
            retryPrompt: 'Could you please repeat what would you like to report?',
            choices: ['Human Traffic.', 'Report', 'Call police'],
        });
    }

    async promptForLocation(stepContext) {
        // Record the party size information in the current dialog state.
        stepContext.values.trafficStep = stepContext.result.value;

        // Prompt for location.
        return await stepContext.prompt(LOCATION_PROMPT, {
            prompt: 'Would you like to use your current location?',
            retryPrompt: 'Sorry, Would you like to use your current location?.',
            choices: ['Pestalozzistrasse 3', 'Other'],
        });
    }


    async promptForPhoto(stepContext) {
        // Record the party size information in the current dialog state.
        stepContext.values.location = stepContext.result.value + ' Zurich';

        // Prompt for location.
        return await stepContext.prompt(PHOTO_PROMPT, {
            prompt: 'Great, Could you please snap photo of incident?',
            retryPrompt: 'Great, Could you please snap photo of incident?'
        });
    }


    async promptForReservationDate(stepContext) {
        // Record the location information in the current dialog state.
        console.log(stepContext.result);
        stepContext.values.photo_url = stepContext.result[0]['contentUrl'];

        return await stepContext.prompt(
            RESERVATION_DATE_PROMPT, {
                prompt: 'And when did this incident happened?',
                retryPrompt: 'Sorry, when did this incident happened?.',
                choices: ['3-Oct-2019', 'Other'],
            });
    }

    async promptForConfirm(stepContext) {
        // Retrieve the reservation date.
        const resolution = stepContext.result[0];
        const time = resolution.value || resolution.start;
        stepContext.values.time = resolution.value || resolution.start;

        return await stepContext.prompt(
            CONFIRM_PROMPT, {
                prompt: 'Could you reveal your identity?',
                retryPrompt: 'Sorry, could you reveal your identity',
                choices: ['Stay anonymous', 'Yes, I can'],
            });
    }


    async acknowledgeReservation(stepContext) {
        
        // Send an acknowledgement to the user.
        await stepContext.context.sendActivity(
            'Updating incident.');

        // Return the collected information to the parent context.
        return await stepContext.endDialog({
            date: stepContext.values.time,
            size: stepContext.values.size,
            location: stepContext.values.location,
            photo_url: stepContext.values.photo_url,
            trafficStep: stepContext.values.trafficStep
        });
    }

    async rangeValidator(promptContext) {
        // Check whether the input could be recognized as an integer.
        if (!promptContext.recognized.succeeded) {
            await promptContext.context.sendActivity(
                "I'm sorry, I do not understand. Please enter the number of people in your party.");
            return false;
        } else if (promptContext.recognized.value % 1 != 0) {
            await promptContext.context.sendActivity(
                "I'm sorry, I don't understand fractional people.");
            return false;
        }

        // Check whether the party size is appropriate.
        var size = promptContext.recognized.value;
        if (size < promptContext.options.validations.min ||
            size > promptContext.options.validations.max) {
            await promptContext.context.sendActivity(
                'Sorry, we can only take reservations for parties of ' +
                `${promptContext.options.validations.min} to ` +
                `${promptContext.options.validations.max}.`);
            await promptContext.context.sendActivity(promptContext.options.retryPrompt);
            return false;
        }

        return true;
    }

    async dateValidator(promptContext) {
        // Check whether the input could be recognized as an integer.
        if (!promptContext.recognized.succeeded) {
            await promptContext.context.sendActivity(
                "I'm sorry, I do not understand. Please enter the date or time for your reservation.");
            return false;
        }

        // Check whether any of the recognized date-times are appropriate,
        // and if so, return the first appropriate date-time.
        const earliest = Date.now() + (60 * 60 * 1000);
        let value = null;
        promptContext.recognized.value.forEach(candidate => {
            // TODO: update validation to account for time vs date vs date-time vs range.
            const time = new Date(candidate.value || candidate.start);
            if (earliest < time.getTime()) {
                value = candidate;
            }
        });
        if (value) {
            promptContext.recognized.value = [value];
            return true;
        }

        await promptContext.context.sendActivity(
            "I'm sorry, we can't take reservations earlier than an hour from now.");
        return false;
    }
}

module.exports.DialogPromptBot = DialogPromptBot;