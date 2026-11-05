-- AlterTable
ALTER TABLE "telemetry_processed" ADD COLUMN     "CDOM_value" DECIMAL(7,3),
ADD COLUMN     "CDOMtemp_value" DECIMAL(7,3),
ADD COLUMN     "HDO_value" DECIMAL(7,3),
ADD COLUMN     "HDOper_value" DECIMAL(7,3),
ADD COLUMN     "ORP_value" DECIMAL(7,3),
ADD COLUMN     "TYRP_value" DECIMAL(7,3),
ADD COLUMN     "TYRPppb_value" DECIMAL(7,3),
ADD COLUMN     "nh4_value" DECIMAL(7,3),
ADD COLUMN     "pHmV_value" DECIMAL(7,3),
ADD COLUMN     "turb_value" DECIMAL(7,3);

-- RenameIndex
ALTER INDEX "sensor_calibration_device_id_parameter_key" RENAME TO "uq_calibration_device_param";
