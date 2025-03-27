// MixpanelManager.js
import { Mixpanel } from 'mixpanel-react-native';

class MixpanelManager {
  static mixpanel: Mixpanel | null = null;

  static async initialize() {
    // Configuration options
    const trackAutomaticEvents = false;  // disable legacy autotrack mobile events
    const useNative = true;              // use Native Mode
    // Create instance with full configuration
    this.mixpanel = new Mixpanel(
      'a2e414d407fc299c6f7e967919cd6515',
      trackAutomaticEvents,
      useNative
    );

    console.log('INIT')
    // Initialize Mixpanel
    await this.mixpanel.init();
  }

  static identify_user_session(uid: string) {
    this.mixpanel?.identify(uid);

    // TODO: Pull user from db and set properties
  }

  static clear_identity() {
    this.mixpanel?.reset();
  }

  // Track events with properties
  static trackEvent(eventName: string, properties = {}) {
    this.mixpanel?.track(eventName, properties);
  }

  // Start timing an event
  static startTimedEvent(eventName: string) {
    this.mixpanel?.timeEvent(eventName);
  }

  // Track screen with timing
  static trackScreen(screenName: string) {
    const eventName = `View ${screenName}`;
    this.startTimedEvent(eventName);
    this.trackEvent(eventName, {
      'screen_name': screenName
    });
  }

  // Force flush events
  static flush() {
    this.mixpanel?.flush();
  }

  // Set flush batch size (default is 50)
  static setFlushBatchSize(size: number) {
    this.mixpanel?.setFlushBatchSize(size);
  }

  // Identify user
  static identifyUser(userId: string, userProperties = {}) {
    this.mixpanel?.identify(userId);
    this.mixpanel?.getPeople().set(userProperties);
  }
}

export default MixpanelManager