export type CoreSceneOptions = { variant?: 'home' | 'hero' | 'vault'; labels?: boolean | 'footer'; controls?: boolean };
export function mountCoreScene(container: HTMLElement, options?: CoreSceneOptions): () => void;
