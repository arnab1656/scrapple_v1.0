import { DOMAnalyzerEngine } from "./DomAnalyzerEngine";

export interface ExtractedDataType {
  author: string | null;
  content: string | null;
  email: Array<string> | null;
  phoneNumber: Array<string> | null;
  linkedInURL: string | null;
}

export class DOMFetcherService extends DOMAnalyzerEngine {
  private allPostELements: Array<HTMLElement> | null = [];
  private results: Array<ExtractedDataType> = [];

  constructor(DOM: string) {
    super(DOM);
    this.fetchAllPosts();
    this.masterExtractor();
  }

  private fetchAllPosts(): Array<HTMLElement> {
    if (!this.rootPostContainer || !this.singlePostContainerElement) {
      return [];
    }

    const tmpl = this.singlePostContainerElement;
    const tag = tmpl.tagName.toLowerCase();
    const classes = Array.from(tmpl.classList)
      .map((cls) => `.${cls}`)
      .join("");
    const selector = `${tag}${classes}`;

    const nodeList =
      this.rootPostContainer.querySelectorAll<HTMLElement>(selector);

    return (this.allPostELements = Array.from(nodeList));
  }

  private extractPostAuthorNameData(post: HTMLElement): string | null {
    if (!this.authorNameContainer) {
      return null;
    }
    return this.helperExtractor(this.authorNameContainer, post);
  }

  private extractPostContentData(post: HTMLElement): string | null {
    if (!this.singlePostContentContainer) {
      return null;
    }
    return this.helperExtractor(this.singlePostContentContainer, post);
  }
  private extractPostEmailData(post: HTMLElement): Array<string> | null {
    if (!this.emailContainer) {
      return null;
    }

    const selector = this.emailContainer.getAttribute("href");
    const selectorKey = selector?.split(":")[0];
    const selctorKey = `a[href^="${selectorKey}"]`;
    const emailElements = post.querySelectorAll(selctorKey);

    const emails: Array<string> = [];
    emailElements.forEach((el) => {
      const email = (el as HTMLElement).innerText;
      emails.push(email);
    });

    return emails;
  }

  private extractPostPhoneNumberData(post: HTMLElement): Array<string> {
    if (!this.phoneNumberContainer) {
      return [];
    }

    const tag = this.phoneNumberContainer?.tagName.toLowerCase() || "";

    const classes = this.phoneNumberContainer
      ? Array.from(this.phoneNumberContainer.classList)
          .map((cls) => `.${cls}`)
          .join("")
      : "";

    const selector = `${tag}${classes}`;
    const specificEl = post.querySelector<HTMLElement>(selector);

    const scrappedData = specificEl?.innerText?.trim() || null;

    // Regex to match common phone number formats
    const phoneRegex =
      /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/g;

    // Match all phone numbers
    const phoneNumbers = scrappedData?.match(phoneRegex);

    return phoneNumbers || [];
  }

  private extractPostLinkedInURLData(post: HTMLElement): string | null {
    if (!this.linkedInURLContainer) {
      return null;
    }

    const tag = this.linkedInURLContainer?.tagName.toLowerCase() || "";

    const classes = this.linkedInURLContainer
      ? Array.from(this.linkedInURLContainer.classList)
          .map((cls) => `.${cls}`)
          .join("")
      : "";

    const selector = `${tag}${classes}`;

    const linkedInURLContainer = post.querySelector(selector) as HTMLElement;

    const href = linkedInURLContainer.getAttribute("href");

    return href || null;
  }

  private helperExtractor(
    container: HTMLElement,
    post: HTMLElement
  ): string | null {
    const tag = container?.tagName.toLowerCase() || "";

    const classes = container
      ? Array.from(container.classList)
          .map((cls) => `.${cls}`)
          .join("")
      : "";

    const selector = `${tag}${classes}`;

    const specificEl = post.querySelector<HTMLElement>(selector);

    const scrappedData = specificEl?.innerText?.trim() || null;

    return scrappedData;
  }

  public masterExtractor(): Array<ExtractedDataType> {
    for (const post of this.allPostELements as Array<HTMLElement>) {
      const author = this.extractPostAuthorNameData(post);
      const content = this.extractPostContentData(post);
      const email = this.extractPostEmailData(post);
      const phoneNumber = this.extractPostPhoneNumberData(post);
      const linkedInURL = this.extractPostLinkedInURLData(post);

      this.results.push({
        author,
        content,
        email,
        phoneNumber,
        linkedInURL,
      });
    }

    return this.results;
  }
}
