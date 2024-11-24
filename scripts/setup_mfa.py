# one-time MFA setup script 

import pyotp
import qrcode
from io import BytesIO
from PIL import Image

def generate_mfa_qr(name, issuer):
    # Generate a random base32 secret
    secret = pyotp.random_base32()
    
    # Generate the TOTP URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=name, issuer_name=issuer)
    
    # Generate the QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    # Convert QR code to an image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save the image to a temporary in-memory file
    temp_file = BytesIO()
    img.save(temp_file, format="PNG")
    temp_file.seek(0)

    return secret, Image.open(temp_file)

if __name__ == "__main__":
    # Customize these details
    user_name = "example_user"
    issuer_name = "ExampleApp"

    # Generate the MFA secret and QR code
    secret, qr_image = generate_mfa_qr(user_name, issuer_name)

    # Print the secret key
    print(f"Secret Key (manully enter into an MFA app): {secret}")
    print("Scan the QR code with your authenticator app.")

    # Display the QR code
    qr_image.show()
