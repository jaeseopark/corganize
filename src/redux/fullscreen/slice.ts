import { createSlice } from '@reduxjs/toolkit';
import { FullscreenComponent } from '../../entity/props';

type FullscreenState = {
  payload: FullscreenComponent;
};

export const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState: {
    payload: null,
  },
  reducers: {
    setFullscreen: (state, action: FullscreenState) => {
      state.payload = action.payload;
    },
    unsetFullscreen: (state) => {
      state.payload = null;
    },
  },
});

export const { setFullscreen, unsetFullscreen } = fullscreenSlice.actions;

export const getFullscreennPayload = (state: FullscreenState) => state.payload;

export default fullscreenSlice.reducer;
