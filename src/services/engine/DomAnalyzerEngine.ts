export class DOMAnalyzerEngine {
  protected DOM: Document | null;
  protected rootPostContainer: HTMLElement | null;
  protected authorNameContainer: HTMLElement | null;
  protected emailContainer: HTMLElement | null;
  protected phoneNumberContainer: HTMLElement | null;
  protected linkedInURLContainer: HTMLElement | null;
  protected singlePostContentContainer: HTMLElement | null;
  protected singlePostContainerElement: HTMLElement | null;

  constructor(DOM: string) {
    this.DOM = new DOMParser().parseFromString(DOM, "text/html");
    this.rootPostContainer = null;
    this.authorNameContainer = null;
    this.emailContainer = null;
    this.phoneNumberContainer = null;
    this.linkedInURLContainer = null;
    this.singlePostContainerElement = null;
    this.singlePostContentContainer = null;
    this.extractKeyElements();
  }

  private sanitizeDOM(): void {
    if (!this.DOM) return;

    // Remove tracking scripts
    const scripts = this.DOM.getElementsByTagName("script");
    Array.from(scripts).forEach((script) => script.remove());

    // Remove tracking pixels and iframes
    const trackingElements = this.DOM.querySelectorAll(
      'img[src*="track"], iframe'
    );
    trackingElements.forEach((el) => el.remove());

    // Remove onclick attributes and event listeners
    const allElements = this.DOM.getElementsByTagName("*");
    Array.from(allElements).forEach((el) => {
      el.removeAttribute("onclick");
      el.removeAttribute("onmouseover");
      el.removeAttribute("onmouseout");
    });
  }

  private findPostContainerDetails(): void {
    if (!this.DOM) return;
    const main = this.DOM.querySelector("main");
    if (main instanceof HTMLElement) {
      this.rootPostContainer = main;
    }
  }

  private extractKeyElements(): void {
    this.sanitizeDOM();
    this.findPostContainerDetails();
    this.extractAuthorNameConatinerDetails();
    this.extractEmailContainerDetails();
    this.extractPhoneNumberContainerDetails();
    this.extractLinkedInURLContainerDetails();
    this.extractSinglePostContainerDetails();
    this.extractPostContentContainerDetails();
  }

  private extractAuthorNameConatinerDetails(): void {
    if (!this.rootPostContainer) return;

    const authorElements = this.rootPostContainer.querySelectorAll(
      "span.update-components-actor__title span[dir='ltr'] span.visually-hidden"
    );

    // Until here we are manually analysing the DOM and getting the author name container
    // On next we will use another Alog to get the author name container without manually hard code of the Class Name using AI model

    this.authorNameContainer = authorElements[0] as HTMLElement;
  }

  private extractEmailContainerDetails(): void {
    if (!this.rootPostContainer) return;

    const mailtoLinkConatiner = this.rootPostContainer?.querySelectorAll(
      'a[href^="mailto:"][data-test-app-aware-link]'
    );

    mailtoLinkConatiner.forEach((element) => {
      element.removeAttribute("class");
    });

    // Until here we are manually analysing the DOM and getting the email container
    // On next we will use another Alog to get the email container without manually hard code of the Class Name using AI model

    this.emailContainer = mailtoLinkConatiner[0] as HTMLElement;
  }

  private extractPhoneNumberContainerDetails(): void {
    if (!this.rootPostContainer) return;

    const containers = this.rootPostContainer.querySelector<HTMLDivElement>(
      'div.update-components-text.relative.update-components-update-v2__commentary[dir="ltr"]'
    );

    if (containers) {
      this.phoneNumberContainer = containers;
    }
  }

  private extractLinkedInURLContainerDetails(): void {
    if (!this.rootPostContainer) return;

    const linkedinURLContainer =
      this.rootPostContainer.querySelector<HTMLDivElement>(
        ".update-components-actor__image.relative"
      );

    if (linkedinURLContainer) {
      this.linkedInURLContainer = linkedinURLContainer;
    }
  }

  private extractSinglePostContainerDetails(): void {
    if (!this.rootPostContainer) return;

    const singlePostContainerElement = this.rootPostContainer.querySelector(
      "div.fie-impression-container"
    );

    if (singlePostContainerElement) {
      this.singlePostContainerElement =
        singlePostContainerElement as HTMLElement;
    }
  }

  private extractPostContentContainerDetails(): void {
    if (!this.rootPostContainer) return;

    const postContentContainer = this.rootPostContainer.querySelector(
      'div.update-components-text.update-components-update-v2__commentary[dir="ltr"]'
    );

    if (postContentContainer) {
      this.singlePostContentContainer = postContentContainer as HTMLElement;
    }
  }
}
