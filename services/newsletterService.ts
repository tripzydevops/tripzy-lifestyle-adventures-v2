// services/newsletterService.ts

// Simulate a backend data store for newsletter subscribers.
let subscribers: string[] = [];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const newsletterService = {
  /**
   * Adds an email to the newsletter subscription list.
   * @param email The email address to subscribe.
   * @returns A promise that resolves when the subscription is complete.
   * @throws An error if the email is already subscribed.
   */
  async subscribe(email: string): Promise<void> {
    await delay(1000); // Simulate network request

    if (subscribers.includes(email)) {
      throw new Error('This email is already subscribed.');
    }

    subscribers.push(email);
    console.log('Newsletter Subscribers:', subscribers); // For debugging, shows the "backend" list
  },

  /**
   * Retrieves all subscribed emails. (Mainly for debugging/admin purposes)
   * @returns A promise that resolves to an array of all subscribed emails.
   */
  async getAllSubscribers(): Promise<string[]> {
    await delay(200);
    return [...subscribers];
  }
};
