import { createSlice } from '@reduxjs/toolkit';
import { File } from '../../entity/File';

type SinglePayload = {
  payload: File;
};

type MultiPayload = {
  payload: File[];
};

export const filesSlice = createSlice({
  name: 'files',
  initialState: {
    remote: new Array<File>(),
    local: new Array<string>(),
  },
  reducers: {
    addAll: (state, action: MultiPayload) => {
      const { payload: newFiles } = action;
      if (newFiles) state.remote.push(...newFiles);
    },
    addAllLocal: (state, action: { payload: string[] }) => {
      const { payload: newFiles } = action;
      if (newFiles) state.local.push(...newFiles);
    },
    update: (state, action: SinglePayload) => {
      const { payload: newFile } = action;
      const file = state.remote.find((f) => f.fileid === newFile.fileid);
      // TODO: is this enough?
      Object.assign(file, newFile);
    },
  },
});

export const { addAll, addAllLocal, update } = filesSlice.actions;

export const getRemoteFiles = (state) => state.files.remote;

export const getLocalFiles = (state) => state.files.local;

export default filesSlice.reducer;
