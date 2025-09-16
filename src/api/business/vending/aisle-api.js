/**
 * ERP - 机器组管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';


export const machineAisleApi = {
  queryMachineAisleList: (param) => {
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



  // /**
  //  * 导出机器分组数据
  //  * @returns {Promise} 返回文件下载流
  //  */
  // exportMachineGroup: () => {
  //   return getDownload('/machineGroup/export');
  // },

  // /**
  //  * 导入机器分组数据
  //  * @param {File} file 导入的文件
  //  * @returns {Promise} 返回导入结果
  //  */
  // importMachineGroup: (file) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   return postRequest('/machineGroup/import', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   });
  // }
};