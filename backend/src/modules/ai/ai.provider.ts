import { env } from "../../config/env";
import { IAIProvider } from "./ai.types";
import { InternalProvider } from "./providers/internal.provider";

export class AIProviderFactory {
  private static cachedProvider: IAIProvider | null = null;

  /**
   * Get the active AI provider based on configuration.
   * Default is the safe, grounded internal provider.
   */
  static getProvider(): IAIProvider {
    if (this.cachedProvider) {
      return this.cachedProvider;
    }

    const providerType = (env.AI_PROVIDER || "internal").toLowerCase();

    switch (providerType) {
      case "internal":
      default:
        this.cachedProvider = new InternalProvider();
        break;
    }

    return this.cachedProvider;
  }

  /**
   * Allow swapping provider during testing or dynamic config.
   */
  static setProvider(provider: IAIProvider | null) {
    this.cachedProvider = provider;
  }
}
