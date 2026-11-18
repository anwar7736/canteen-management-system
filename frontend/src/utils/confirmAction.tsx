import Swal from 'sweetalert2';

export default async function confirmAction({
  title,
  text,
  confirmButtonText = 'Confirm',
}) {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#07875e',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    focusCancel: true,
  });
  return result.isConfirmed;
}
