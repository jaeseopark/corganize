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
    hidden: new Array<File>(),
  },
  reducers: {
    addAllRemote: (state, action: MultiPayload) => {
      const { payload: files } = action;
      if (files) state.remote.push(...files);
    },
    addAllHidden: (state, action: MultiPayload) => {
      const { payload: files } = action;
      if (files) state.hidden.push(...files);
    },
    addAllLocal: (state, action: { payload: string[] }) => {
      const { payload: files } = action;
      if (files) state.local.push(...files);
    },
    updateRemote: (state, action: SinglePayload) => {
      const { payload: file } = action;
      const existingFile = state.remote.find((f) => f.fileid === file.fileid);
      Object.assign(existingFile, file);
    },
    deleteRemote: (state, action: SinglePayload) => {
      const { payload: file } = action;
      const i = state.remote.indexOf(file);
      state.remote.splice(i, 1);
    },
  },
});

export const {
  addAllRemote,
  addAllHidden,
  addAllLocal,
  updateRemote,
  deleteRemote,
} = filesSlice.actions;

export const getRemoteFiles = (state) => state.files.remote;

export const getHiddenFiles = (state) => state.files.hidden;

export const getRemoteAndHiddenFiles = (state) =>
  state.files.remote.concat(state.files.hidden);

export const getLocalFiles = (state) => state.files.local;

export default filesSlice.reducer;
