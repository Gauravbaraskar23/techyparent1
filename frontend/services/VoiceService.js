// // services/VoiceService.js
// // // This version is ALWAYS listening - no tap required!
// import Platform from 'react-native';
// import Voice from '@react-native-voice/voice';
// import Tts from 'react-native-tts';
// import Sound from 'react-native-sound';
// import BackgroundTimer from 'react-native-background-timer';
// import PushNotification from 'react-native-push-notification';
// import { 
//   processVoiceCommand, 
//   getActivityReminders, 
//   getStartNotifications, 
//   getVoiceSettings 
// } from '../api/dailyRoutineApi';

// class VoiceService {
//   constructor() {
//     this.isActive = false;
//     this.childId = null;
//     this.voiceSettings = null;
//     this.checkInterval = null;
//     this.lastWakeTime = 0;
    
//     // WAKE WORD CONFIGURATION
//     this.WAKE_WORDS = [
//       'hey techy',
//       'hey techie',
//       'ok techy',
//       'hello techy'
//     ];
    
//     this.initializeTts();
//     this.initializeVoice();
//     this.setupNotifications();
//   }

//   // Initialize Text-to-Speech
//   initializeTts() {
//     Tts.setDefaultLanguage('en-US');
//     Tts.setDefaultRate(0.5);
//     Tts.setDefaultPitch(1.2);
    
//     Tts.addEventListener('tts-start', () => console.log('TTS Started'));
//     Tts.addEventListener('tts-finish', () => console.log('TTS Finished'));
//     Tts.addEventListener('tts-cancel', () => console.log('TTS Cancelled'));
//   }

//   // Initialize Speech Recognition
//   initializeVoice() {
//     Voice.onSpeechStart = () => {
//       console.log('🎤 Speech detected');
//     };
    
//     Voice.onSpeechEnd = () => {
//       console.log('🎤 Speech ended');
//       // IMMEDIATELY restart listening (this is the key!)
//       this.restartListeningAfterDelay();
//     };
    
//     Voice.onSpeechResults = this.onSpeechResults.bind(this);
//     console.log("Voice object:", Voice);
//     Voice.onSpeechError = (e) => {
//       console.log('Speech error:', e);
//       // Restart on error
//       this.restartListeningAfterDelay();
//     };
    
//     // Partial results for real-time wake word detection
//     Voice.onSpeechPartialResults = (event) => {
//       if (event.value && event.value.length > 0) {
//         const partialText = event.value[0].toLowerCase();
        
//         // Show visual feedback when wake word detected
//         if (this.containsWakeWord(partialText)) {
//             const now = Date.now();

//             if (now - this.lastWakeTime > 2000) { // 5 second cooldown to prevent multiple triggers
//                 console.log('✅ Wake word detected in partial!');
//                 this.playWakeWordSound();
//                 this.lastWakeTime = now;
//             }
//         }
//       }
//     };
//   }

//   // Setup notifications
//   setupNotifications() {
//     PushNotification.configure({
//       onNotification: function (notification) {
//         console.log('NOTIFICATION:', notification);
//       },
//       requestPermissions: Platform.OS === 'ios',
//     });

//     PushNotification.createChannel({
//       channelId: 'routine-voice',
//       channelName: 'Routine Voice Notifications',
//       playSound: true,
//       soundName: 'default',
//       importance: 4,
//       vibrate: true,
//     });
//   }

//   // Start voice assistant - AUTOMATICALLY STARTS LISTENING
//   async start(childId) {
//     if (this.isActive){
//         console.log('Voice assistant already active');
//         return;
//     }
//     this.childId = childId;
//     this.isActive = true;
    
//     console.log('🚀 Voice Assistant Starting...');
    
//     // Load voice settings
//     try {
//       this.voiceSettings = await getVoiceSettings(childId);
//       this.applyVoiceSettings();
      
//       if (this.voiceSettings.wake_word) {
//         this.WAKE_WORDS = [
//           this.voiceSettings.wake_word.toLowerCase(),
//           ...this.WAKE_WORDS
//         ];
//       }
//     } catch (error) {
//       console.error('Error loading voice settings:', error);
//     }

//     // Start checking for reminders every minute
//     this.checkInterval = BackgroundTimer.setInterval(() => {
//       this.checkForReminders();
//       this.checkForStartNotifications();
//     }, 60000);

//     // AUTOMATICALLY START LISTENING - NO TAP REQUIRED!
//     await this.startContinuousListening();

//     console.log('✅ Voice assistant is ALWAYS LISTENING');
//     console.log('💬 Just say "Hey Techy" + your command');
    
//     // Announce that voice assistant is ready
//     setTimeout(() => {
//       this.speak("Voice assistant is ready and listening!");
//     }, 1000);
//   }

//   // Stop voice assistant
//   async stop() {
//     this.isActive = false;
    
//     if (this.checkInterval) {
//       BackgroundTimer.clearInterval(this.checkInterval);
//       this.checkInterval = null;
//     }
    
//     await this.stopListening();
//     console.log('Voice assistant stopped');
//   }

//   // Apply voice settings
//   applyVoiceSettings() {
//     if (!this.voiceSettings) return;

//     Tts.setDefaultLanguage(this.voiceSettings.language);
//     Tts.setDefaultRate(this.voiceSettings.speech_rate);
//     Tts.setDefaultPitch(this.voiceSettings.pitch);
//   }

//   // Check if text contains wake word
//   containsWakeWord(text) {
//     const lowerText = text.toLowerCase().trim();
    
//     for (const wakeWord of this.WAKE_WORDS) {
//       if (lowerText.includes(wakeWord)) {
//         return true;
//       }
//     }
    
//     return false;
//   }

//   // Extract command after wake word
//   extractCommand(text) {
//     const lowerText = text.toLowerCase();
    
//     for (const wakeWord of this.WAKE_WORDS) {
//       const index = lowerText.indexOf(wakeWord);
//       if (index !== -1) {
//         const commandStart = index + wakeWord.length;
//         const command = text.substring(commandStart).trim();
//         return command;
//       }
//     }
    
//     return text;
//   }

//   // Handle final speech results
//   async onSpeechResults(event) {
//     if (!event.value || event.value.length === 0) return;

//     const spokenText = event.value[0];
//     console.log('📢 Heard:', spokenText);

//     // CHECK FOR WAKE WORD
//     if (!this.containsWakeWord(spokenText)) {
//       console.log('❌ No wake word - ignoring');
//       // Don't give feedback every time - too annoying
//       return;
//     }

//     // WAKE WORD FOUND!
//     const command = this.extractCommand(spokenText);
//     console.log('✅ Processing command:', command);

//     // If only wake word (no command)
//     if (!command || command.length < 3) {
//       this.speak("Yes? I'm listening.");
//       return;
//     }

//     // Process the command
//     await this.processCommand(command);
//   }

//   // Process the actual command
//   async processCommand(command) {
//     try {
//       console.log('🔄 Processing:', command);
      
//       const response = await processVoiceCommand(
//         this.childId, 
//         command, 
//         0.9
//       );
      
//       if (response.success && response.speak_response) {
//         this.speak(response.response_text);
//       } else {
//         this.speak(response.response_text || "I didn't understand that.");
//       }
//     } catch (error) {
//       console.error('Error processing command:', error);
//       this.speak("Sorry, I had trouble with that. Please try again.");
//     }
//   }

//   // Play wake word sound
//   playWakeWordSound() {
//     // Simple beep sound
//     const sound = new Sound('wake_word.mp3', Sound.MAIN_BUNDLE, (error) => {
//       if (error) {
//         console.log('Wake word sound not found');
//         return;
//       }
//       sound.play(() => sound.release());
//     });
//   }

//   // Start continuous listening (THE KEY METHOD!)
//   async startContinuousListening() {
//     try {

//         if (!Voice) {
//       console.log("❌ Voice module not available");
//       return;
//     }

//       await Voice.start('en-US');
//       console.log('🎧 Continuous listening ACTIVE');
//     } catch (error) {
//       console.error('Error starting continuous listening:', error);
      
//       // Retry after 2 seconds
//       setTimeout(() => {
//         if (this.isActive) {
//           this.startContinuousListening();
//         }
//       }, 2000);
//     }
//   }

//   // Restart listening after speech ends
//   async restartListeningAfterDelay() {
//     if (!this.isActive) return;
    
//     // Small delay to prevent issues
//     setTimeout(async () => {
//       try {
//         await Voice.start('en-US');
//         console.log('🔄 Listening restarted');
//       } catch (error) {
//         console.error('Error restarting:', error);
//         // Try again
//         setTimeout(() => {
//           if (this.isActive) {
//             this.startContinuousListening();
//           }
//         }, 1000);
//       }
//     }, 100);
//   }

//   // Stop listening
//   async stopListening() {
//     try {
//       await Voice.stop();
//       await Voice.destroy();
//       console.log('Stopped listening');
//     } catch (error) {
//       console.error('Error stopping voice:', error);
//     }
//   }

//   // Check for activity reminders
//   async checkForReminders() {
//     if (!this.childId) return;

//     try {
//       const response = await getActivityReminders(this.childId);
      
//       if (response.reminders && response.reminders.length > 0) {
//         for (const reminder of response.reminders) {
//           this.speakAndNotify(
//             reminder.reminder_text,
//             reminder.activity_title,
//             'reminder'
//           );
//         }
//       }
//     } catch (error) {
//       console.error('Error checking reminders:', error);
//     }
//   }

//   // Check for activity start notifications
//   async checkForStartNotifications() {
//     if (!this.childId) return;

//     try {
//       const response = await getStartNotifications(this.childId);
      
//       if (response.notifications && response.notifications.length > 0) {
//         for (const notification of response.notifications) {
//           this.speakAndNotify(
//             notification.notification_text,
//             notification.activity_title,
//             'start'
//           );
//         }
//       }
//     } catch (error) {
//       console.error('Error checking start notifications:', error);
//     }
//   }

//   // Speak text and show notification
//   speakAndNotify(text, title, type) {
//     this.speak(text);

//     PushNotification.localNotification({
//       channelId: 'routine-voice',
//       title: title,
//       message: text,
//       playSound: true,
//       soundName: 'default',
//       importance: 'high',
//       vibrate: true,
//       vibration: 300,
//     });

//     this.playNotificationSound(type);
//   }

//   // Speak text using TTS
//   speak(text) {
//     Tts.stop();
//     Tts.speak(text);
//   }

//   // Play notification sound
//   playNotificationSound(type) {
//     const soundFile = type === 'reminder' ? 'bell.mp3' : 'notification.mp3';
//     const sound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
//       if (error) {
//         console.log('Failed to load sound', error);
//         return;
//       }
//       sound.play(() => sound.release());
//     });
//   }

//   // Get listening status
//   getStatus() {
//     return {
//       isActive: this.isActive,
//       childId: this.childId,
//       wakeWords: this.WAKE_WORDS,
//     };
//   }

//   // Manual speak (for testing)
//   async testSpeak(text) {
//     this.speak(text);
//   }

//   // Test wake word detection
//   testWakeWord(text) {
//     console.log('Testing:', text);
//     console.log('Contains wake word:', this.containsWakeWord(text));
//     if (this.containsWakeWord(text)) {
//       const command = this.extractCommand(text);
//       console.log('Command:', command);
//     }
//   }
// }

// export default new VoiceService();

