import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useShop } from "@/contexts/ShopContext";

export function ShopChangeDialog() {
  const navigate = useNavigate();
  const { 
    showShopChangeDialog, 
    pendingShop, 
    confirmShopChange, 
    cancelShopChange 
  } = useShop();

  if (!pendingShop) return null;

  const handleConfirm = () => {
    confirmShopChange();
    navigate("/inventory");
  };

  return (
    <AlertDialog open={showShopChangeDialog} onOpenChange={(open) => !open && cancelShopChange()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mağaza değiştirmek istiyor musunuz?</AlertDialogTitle>
          <AlertDialogDescription>
            Şu anda bir ürün oluşturuyorsunuz. Mağaza değiştirirseniz yaptığınız değişiklikler kaybolacak.
            <br /><br />
            <strong>{pendingShop.name}</strong> ({pendingShop.platform}) mağazasına geçmek istiyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelShopChange}>
            İptal
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Değişiklikleri İptal Et ve Geç
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
