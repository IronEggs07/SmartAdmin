/**
 * ERP - 机器管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const machineApi = {

  queryMachineList: (param) => {
    return postRequest('/vending/machine/query', param);
  },


  addMachine: (param) => {
    return postRequest('/vending/machine/add', param);
  },


  updateMachine: (param) => {
    return postRequest('/vending/machine/update', param);
  },


  deleteMachine: (machineId) => {
    return getRequest(`/vending/machine/delete/${machineId}`);
  },


  batchDelete: (machineIdList) => {
    return postRequest('/vending/machine/batchDelete', machineIdList);
  },


  queryAisleList: (machineId) => {
    // 完全按照 Swagger 文档的规定来构建 URL
    return getRequest(`/vending/machine/${machineId}/aisles`);
  },

  exportMachine: () => {
    return getDownload('/vending/machine/export');
  },


  importMachine: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return postRequest('/vending/machine/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};