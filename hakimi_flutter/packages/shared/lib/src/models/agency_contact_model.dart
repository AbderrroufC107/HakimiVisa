/// Agency contact details served publicly for the client app.
///
/// Every field is nullable: the agency may not have filled it in yet, and the
/// UI hides whatever is missing rather than showing a placeholder.
class AgencyContactModel {
  final String? agencyName;
  final String? agencyAddress;
  final String? agencyPhone;
  final String? agencyEmail;
  final String? agencyWebsite;
  final String? logoUrl;

  const AgencyContactModel({
    this.agencyName,
    this.agencyAddress,
    this.agencyPhone,
    this.agencyEmail,
    this.agencyWebsite,
    this.logoUrl,
  });

  factory AgencyContactModel.fromJson(Map<String, dynamic> json) {
    String? read(String camel, String snake) =>
        (json[camel] ?? json[snake]) as String?;

    return AgencyContactModel(
      agencyName: read('agencyName', 'agency_name'),
      agencyAddress: read('agencyAddress', 'agency_address'),
      agencyPhone: read('agencyPhone', 'agency_phone'),
      agencyEmail: read('agencyEmail', 'agency_email'),
      agencyWebsite: read('agencyWebsite', 'agency_website'),
      logoUrl: read('logoUrl', 'logo_url'),
    );
  }

  Map<String, dynamic> toJson() => {
        'agencyName': agencyName,
        'agencyAddress': agencyAddress,
        'agencyPhone': agencyPhone,
        'agencyEmail': agencyEmail,
        'agencyWebsite': agencyWebsite,
        'logoUrl': logoUrl,
      };
}
