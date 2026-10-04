export const metadata = {
  title: "Kullanım Şartları ve Gizlilik Politikası — Pets Friend",
};

const sections = `
# Pets Friend — Kullanım Şartları ve Gizlilik Politikası

Son güncelleme: [Tarih]

## BÖLÜM 1 — KULLANIM ŞARTLARI

### 1. Taraflar
Bu Kullanım Şartları, Pets Friend uygulaması ile Platform'u kullanan kişi arasındaki ilişkiyi düzenler. Platform'u kullanarak bu Şartları kabul etmiş sayılırsınız.

### 2. Hizmetin Tanımı
Pets Friend, köpek sahiplerinin birbirleriyle konum bazlı olarak eşleşmesini, iletişim kurmasını ve yürüyüş/buluşma etkinlikleri düzenlemesini sağlayan bir platformdur. Platform, buluşmaların kendisini düzenlemez, denetlemez veya garanti etmez.

### 3. Yaş Sınırı
Platform'u kullanabilmek için 18 yaşını doldurmuş olmanız gerekmektedir.

### 4. Hesap Oluşturma ve Sorumluluklar
Kayıt sırasında verdiğiniz bilgilerin doğru ve güncel olmasından siz sorumlusunuz. Hesabınızın güvenliğinden siz sorumlusunuz. Bir hesap yalnızca bir kişi tarafından kullanılabilir.

### 5. Kullanıcı İçeriği
Yüklediğiniz içerik size aittir; ancak Platform üzerinde gösterilmesi amacıyla bize kullanım hakkı vermiş olursunuz. Aşağıdaki türde içerik paylaşımı kesinlikle yasaktır:
- Çıplaklık, müstehcen veya cinsel içerik
- Şiddet, nefret söylemi, taciz veya ayrımcılık
- Sahte kimlik veya başkasına ait fotoğraf kullanımı
- Spam veya izinsiz ticari paylaşım
- Yasa dışı faaliyetleri teşvik eden içerik

Bu kurallara aykırı içerik önceden bildirim yapılmaksızın kaldırılabilir, hesap askıya alınabilir.

### 6. İçerik Denetimi
Yüklenen fotoğraflar otomatik içerik analizi sistemleriyle taranabilir. Uygunsuz içeriği "Bildir" özelliğiyle bize iletebilirsiniz.

### 7. Buluşmalar ve Fiziksel Güvenlik
Buluşmalar tamamen kullanıcılar arasındaki gönüllü etkileşimlerdir. Pets Friend katılımcıların kimliğini doğrulamaz. Buluşmalar sırasında yaşanabilecek olaylardan Pets Friend sorumlu tutulamaz.

### 8. Yasaklı Davranışlar
Diğer kullanıcıları taciz etmek, sahte profil oluşturmak, platformu ticari amaçla izinsiz kullanmak veya teknik altyapıya zarar vermeye çalışmak yasaktır.

### 9. Hesabın Askıya Alınması
Şartların ihlali hâlinde hesabınız bildirim yapılmaksızın askıya alınabilir veya kapatılabilir.

### 10. Sorumluluğun Sınırlandırılması
Platform "olduğu gibi" sunulmaktadır. Yasaların izin verdiği azami ölçüde, kullanımdan doğabilecek zararlardan sorumlu tutulamayız.

### 11. Değişiklikler
Bu Şartlar güncellenebilir. Güncelleme sonrası kullanıma devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.

## BÖLÜM 2 — GİZLİLİK POLİTİKASI

### 1. Topladığımız Veriler
E-posta adresiniz, köpek profil bilgileriniz, konum verisi, yüklediğiniz fotoğraflar ve buluşma bilgileriniz işlenir.

### 2. Konum Verisinin Kullanımı
Konumunuz diğer kullanıcılara yalnızca yaklaşık mesafe olarak gösterilir, tam koordinatlarınız paylaşılmaz. Konum paylaşımı isteğe bağlıdır.

### 3. Verilerin Paylaşılması
Verileriniz hizmetin sağlanması için kullandığımız altyapı sağlayıcılarıyla (barındırma ve veritabanı hizmetleri) paylaşılır. Pazarlama amacıyla üçüncü kişilerle paylaşılmaz veya satılmaz.

### 4. Haklarınız
KVKK kapsamında verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme hakkına sahipsiniz.

### 5. İletişim
Sorularınız için Platform üzerinden bize ulaşabilirsiniz.
`;

function renderContent(text) {
  const lines = text.trim().split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={i} className="font-display text-2xl font-semibold mt-2 mb-3">
          {trimmed.replace("# ", "")}
        </h1>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-xl font-semibold mt-8 mb-3 text-primary">
          {trimmed.replace("## ", "")}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="font-semibold text-[15px] mt-5 mb-2">
          {trimmed.replace("### ", "")}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <li key={i} className="text-sm text-inksoft ml-4 mb-1">
          {trimmed.replace("- ", "")}
        </li>
      );
    }
    if (trimmed === "") {
      return null;
    }
    return (
      <p key={i} className="text-sm text-inksoft mb-3 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export default function TermsPage() {
  return (
    <div className="px-5 pt-14 pb-16 safe-top">
      {renderContent(sections)}
    </div>
  );
}
