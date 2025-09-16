/**
 * ERP - 机器类型管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const machineModelApi = {

  queryMachineModelList: (param) => {
    return postRequest('/model/query', param);
  },


  addMachineModel: (param) => {
    return postRequest('/model/add', param);
  },


  updateMachineModel: (param) => {
    return postRequest('/model/update', param);
  },


  deleteMachineModel: (modelId) => {
    return getRequest(`/model/delete/${modelId}`);
  },


  batchDelete: (modelIdList) => {
    return postRequest('/model/batchDelete', modelIdList);
  },


};