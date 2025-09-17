/**
 * ERP - 机器类型管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const machineModelApi = {

  queryMachineModelList: (param) => {
    return postRequest('/vending/model/query', param);
  },


  addMachineModel: (param) => {
    return postRequest('/vending/model/add', param);
  },


  updateMachineModel: (param) => {
    return postRequest('/vending/model/update', param);
  },


  deleteMachineModel: (modelId) => {
    return getRequest(`/vending/model/delete/${modelId}`);
  },


  batchDelete: (modelIdList) => {
    return postRequest('/vending/model/batchDelete', modelIdList);
  },


};