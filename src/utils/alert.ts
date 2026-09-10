import Swal from 'sweetalert2';

export const AppAlert = {
  loading(title: string = 'Memproses...') {
    Swal.fire({
      title: title,
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },
  
  close() {
    Swal.close();
  },

  success(title: string, message: string = '') {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#3b82f6'
    });
  },

  error(title: string = 'Terjadi Kesalahan', errorMsg: any) {
    // Menangkap pesan error spesifik dari Supabase atau Axios
    const message = errorMsg?.message || errorMsg || 'Gagal berkomunikasi dengan server.';
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#ef4444'
    });
  }
};