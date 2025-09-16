/**
 * ERP - 机器组管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';


export const machineGroupApi = {
  queryMachineGroupList: (param) => {
    return postRequest('/machineGroup/query', param);
  },

  addMachineGroup: (param) => {
    return postRequest('/machineGroup/add', param);
  },

  updateMachineGroup: (param) => {
    return postRequest('/machineGroup/update', param);
  },

  deleteMachineGroup: (groupId) => {
    return getRequest(`/machineGroup/delete/${groupId}`);
  },

  batchDelete: (groupIdList) => {
    return postRequest('/machineGroup/batchDelete', groupIdList);
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