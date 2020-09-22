import axios from 'axios';

export function getNotes(cb: (err: string, data: any) => void) {
  axios({
    url: '/api/getNotes',
    method: 'get',
    params: {
      id: 123
    }
  })
    .then((response) => {
      cb(null, response.data);
    })
    .catch((error) => {
      cb(error.response.data, null);
    });
}

export function saveNotes(cb: (err: string, data: any) => void) {}
