/**
 * ERP - 机器组管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';


export const machineAisleApi = {
  queryAisleList: (param) => {
    return postRequest('/aisle/query', param);
  },

  addMachineAisle: (param) => {
    return postRequest('/aisle/add', param);
  },

  updateMachineAisle: (param) => {
    return postRequest('/aisle/update', param);
  },

  deleteMachineAisle: (aisleId) => {
    return getRequest(`/aisle/delete/${aisleId}`);
  },

  batchDelete: (aisleIdList) => {
    return postRequest('/aisle/batchDelete', aisleIdList);
  },

};