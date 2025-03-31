import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import './main.html';
import './main.css'; // Ensure CSS is imported

// Create a reactive variable to store chat messages
const messages = new ReactiveVar([]);

Template.chatInterface.onCreated(function chatInterfaceOnCreated() {
  // Initialize with a welcome message (optional)
  messages.set([{ sender: 'bot', text: 'Ask me anything about Bitcoin or the Lightning Network.' }]);
});

Template.chatInterface.helpers({
  chatMessages() {
    // Return the messages array for display
    return messages.get();
  },
  // Helper to add CSS classes based on sender
  messageClass(sender) {
    return sender === 'user' ? 'user-message' : 'bot-message';
  }
});

Template.chatInterface.events({
  // Handle send button click
  'click #send-button'(event, instance) {
    sendMessage(instance);
  },
  // Handle Enter key press in the input field
  'keypress #user-input'(event, instance) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission
      sendMessage(instance);
    }
  }
});

// Function to handle sending a message
function sendMessage(instance) {
  const inputElement = instance.find('#user-input');
  const userMessageText = inputElement.value.trim();

  if (userMessageText) {
    // Add user message to the reactive array
    const currentMessages = messages.get();
    messages.set([...currentMessages, { sender: 'user', text: userMessageText }]);

    // Clear the input field
    inputElement.value = '';

    // Scroll chat log to the bottom
    const chatLog = instance.find('#chat-log');
    chatLog.scrollTop = chatLog.scrollHeight;


    // Call the server method to get the bot's response
    Meteor.call('getSaylorBotResponse', userMessageText, (error, botResponseText) => {
      if (error) {
        console.error("Error calling server method:", error);
        // Add an error message to the chat
        const currentMessages = messages.get();
        messages.set([...currentMessages, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
      } else {
        // Add bot response to the reactive array
        const currentMessages = messages.get();
        messages.set([...currentMessages, { sender: 'bot', text: botResponseText }]);
      }
      // Scroll chat log to the bottom again after bot response
       chatLog.scrollTop = chatLog.scrollHeight;
    });
  }
}

// Scroll chat log down when new messages are added
Template.chatInterface.onRendered(function() {
  const chatLog = this.find('#chat-log');
  this.autorun(() => {
    // Trigger autorun when messages change
    messages.get();
    // Use Tracker.afterFlush to ensure the DOM is updated before scrolling
    Tracker.afterFlush(() => {
      if (chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    });
  });
});
