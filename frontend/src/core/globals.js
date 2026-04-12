const { useState, useRef, useCallback, useEffect, useLayoutEffect } = React;

const SECTIONS_BASE = [
  { id:"read",    label:"Read",    accent:"#8B6914" },
  { id:"moments", label:"Moments", accent:"#8B6914" },
  { id:"worth",   label:"Worth",   accent:"#8B6914" },
  { id:"sharing", label:"Sharing", accent:"#8B6914" },
];
const SECTIONS = SECTIONS_BASE.map(s=>({...s, color:"var(--bg)"}));
const HEADER_HEIGHT = 44;
const TRACK_W = 320;
const UNIT = TRACK_W / 4;
