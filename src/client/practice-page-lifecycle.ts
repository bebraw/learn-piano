export interface PracticePageLifecycleController {
  disconnect(): void;
  dispose(): void;
}

export function handlePracticePageHide(controller: PracticePageLifecycleController, event: Pick<PageTransitionEvent, "persisted">): void {
  if (event.persisted) {
    controller.disconnect();
    return;
  }

  controller.dispose();
}
