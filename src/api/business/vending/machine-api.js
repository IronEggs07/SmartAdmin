/**
 * ERP - 机器管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const machineApi = {

  queryMachineList: (param) => {
    return postRequest('/machine/query', param);
  },


  addMachine: (param) => {
    return postRequest('/machine/add', param);
  },


  updateMachine: (param) => {
    return postRequest('/machine/update', param);
  },


  deleteMachine: (machineId) => {
    return getRequest(`/machine/delete/${machineId}`);
  },


  batchDelete: (machineIdList) => {
    return postRequest('/machine/batchDelete', machineIdList);
  },


  exportMachine: () => {
    return getDownload('/machine/export');
  },


  importMachine: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return postRequest('/machine/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};