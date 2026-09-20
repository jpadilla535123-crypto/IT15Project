using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventSphere.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenceHash",
                table: "Registrations",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerName",
                table: "Registrations",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenceHash",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "PayerName",
                table: "Registrations");
        }
    }
}
