import { HammerGestureConfig } from '@angular/platform-browser';
import { Injectable } from "@angular/core";

@Injectable()
export class HammerJsConf extends HammerGestureConfig {
	overrides = {
		swipe: { velocity: 0.3, threshold: 10 },
	} as any;
}
