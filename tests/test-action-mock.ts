import { join } from "path";
import { Action, AppearDisappearEvent, BaseAction, KeyEvent } from "../src";
import { sd } from "./index";
import { TEST_ACTION_UUID } from "./stream-deck-mock";

@Action("test-action")
export class TestActionMock extends BaseAction {

  onDisappear() {
    // trigger
  }

  onAppear(e: AppearDisappearEvent) {
    sd.setTitle(e.context, "Test Title");
    sd.setImage(e.context, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=");
    sd.setImage(e.context, "https://www.pngkey.com/png/detail/178-1787508_github-icon-download-at-icons8-white-github-icon.png");
    sd.setImage(e.context, "https://www.pngkey.com/png/detail/178-1787508_github-icon-download-at-icons8-white-github-icon.png");
    sd.setImage(e.context, join(__dirname, "/image.png"));
    sd.setState(e.context, 1);
    sd.showAlert(e.context);
    sd.showOk(e.context);
    sd.logMessage("message");
    sd.switchToProfile(e.context, "DEVICE_ID", "PROFILE_ID");
    sd.openUrl("https://github.com");
    sd.sendToPropertyInspector(e.context, TEST_ACTION_UUID, { content: "" });
  }

  onSingleTap(e: KeyEvent) {
    sd.setTitle(e.context, "onSingleTap");
  }

  onDoubleTap(e: KeyEvent) {
    sd.setTitle(e.context, "onDoubleTap");
  }

  onLongPress(e: KeyEvent) {
    sd.setTitle(e.context, "onLongPress");
  }

  onPluginSettingsChanged() {
    // trigger
  }

  onSettingsChanged() {
    // trigger
  }

}
